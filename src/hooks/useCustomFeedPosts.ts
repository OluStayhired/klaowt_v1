import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../auth';
import { Post } from '../types/post';
import { FeedAlgorithm } from '../components/feeds/create/types';
import { calculateKeywordMatch } from '../utils/keywordMatching';
import { calculateTimeScore } from '../utils/timeScoring';

const debugLog = (message: string, data?: any) => {
  console.log(`[Custom Feed Posts] ${message}`, data ? JSON.stringify(data, null, 2) : '');
};

// Cache for thread responses to avoid duplicate requests
const threadCache = new Map<string, any>();

export function useCustomFeedPosts(feedUri: string) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { agent, user } = useAuthStore();

  // Memoize thread fetching function
  const fetchThreadWithCache = useCallback(async (uri: string) => {
    if (threadCache.has(uri)) {
      return threadCache.get(uri);
    }

    const response = await agent?.getPostThread({ uri, depth: 1 });
    if (response) {
      threadCache.set(uri, response);
    }
    return response;
  }, [agent]);

  // Process posts in batches
  const processPosts = useCallback(async (
    posts: any[],
    algorithm: FeedAlgorithm,
    processedUris: Set<string>
  ) => {
    const batchSize = 10;
    const processedPosts: Post[] = [];
    const batches = Math.ceil(posts.length / batchSize);

    for (let i = 0; i < batches; i++) {
      const batch = posts.slice(i * batchSize, (i + 1) * batchSize);
      const batchPromises = batch.map(async (item) => {
        if (!item?.post?.record?.text || processedUris.has(item.post.uri)) {
          return null;
        }

        try {
          // Check for user replies
          const threadResponse = await fetchThreadWithCache(item.post.uri);
          const hasUserReplied = threadResponse?.data.thread.replies?.some(
            (reply: any) => reply.post.author.did === user?.did
          );

          if (hasUserReplied) {
            return null;
          }

          // Get parent post for replies
          const isReply = item.reply?.parent && item.reply?.root;
          let parentPost = null;

          if (isReply) {
            const parentResponse = await fetchThreadWithCache(item.reply.parent.uri);
            if (parentResponse?.data?.thread?.post) {
              parentPost = {
                uri: parentResponse.data.thread.post.uri,
                cid: parentResponse.data.thread.post.cid,
                author: parentResponse.data.thread.post.author,
                record: parentResponse.data.thread.post.record,
                replyCount: parentResponse.data.thread.post.replyCount || 0,
                repostCount: parentResponse.data.thread.post.repostCount || 0,
                likeCount: parentResponse.data.thread.post.likeCount || 0,
                indexedAt: parentResponse.data.thread.post.indexedAt,
              };
            }
          }

          // Apply filters
          const { interactionThresholds, timeRange, keywordMatchThreshold = 5 } = algorithm;
          
          if (interactionThresholds) {
            const { minLikes = 0, minReposts = 0 } = interactionThresholds;
            if (item.post.likeCount < minLikes || item.post.repostCount < minReposts) {
              return null;
            }
          }

          const timeScore = calculateTimeScore(
            new Date(item.post.indexedAt),
            timeRange?.start ? new Date(timeRange.start) : undefined,
            timeRange?.end ? new Date(timeRange.end) : undefined
          );

          if (timeScore < 0.2) {
            return null;
          }

          const keywordMatch = algorithm.keywords?.length 
            ? calculateKeywordMatch(item.post.record.text || '', algorithm.keywords)
            : { percentage: 100, matchedWords: [], matches: [] };

          if (keywordMatch.percentage < keywordMatchThreshold) {
            return null;
          }

          return {
            uri: item.post.uri,
            cid: item.post.cid,
            author: item.post.author,
            record: item.post.record,
            replyCount: item.post.replyCount || 0,
            repostCount: item.post.repostCount || 0,
            likeCount: item.post.likeCount || 0,
            indexedAt: item.post.indexedAt,
            keywordMatch,
            timeScore,
            isReply,
            parentPost
          };
        } catch (err) {
          console.warn('Error processing post:', err);
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      const validPosts = batchResults.filter((post): post is Post => post !== null);
      processedPosts.push(...validPosts);
    }

    return processedPosts;
  }, [fetchThreadWithCache, user?.did]);

  useEffect(() => {
    let mounted = true;

    async function fetchPosts() {
      if (!agent || !user) {
        debugLog('Missing required data', { hasAgent: !!agent, hasUser: !!user });
        return;
      }

      try {
        setLoading(true);
        debugLog('Fetching posts for custom feed', { feedUri });

        // Get feed algorithm from localStorage
        const customFeeds = JSON.parse(localStorage.getItem('bluesky_custom_feeds') || '[]');
        const customFeed = customFeeds.find((feed: any) => feed.uri === feedUri);

        if (!customFeed?.algorithm) {
          debugLog('No algorithm found for custom feed', { feedUri });
          return;
        }

        const response = await agent.getTimeline({
          limit: 100,
        });

        if (!mounted) return;

        const processedUris = new Set<string>();
        const processedPosts = await processPosts(
          response.data.feed,
          customFeed.algorithm,
          processedUris
        );

        debugLog('Processed posts', {
          totalPosts: response.data.feed.length,
          matchingPosts: processedPosts.length,
          withParents: processedPosts.filter(p => p.parentPost).length
        });

        if (mounted) {
          setPosts(processedPosts);
          setError(null);
        }
      } catch (err: any) {
        console.error('Error fetching custom feed posts:', err);
        if (mounted) {
          setError('Failed to load posts. Please try again.');
          setPosts([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchPosts();

    return () => {
      mounted = false;
      // Clear cache on unmount
      threadCache.clear();
    };
  }, [agent, feedUri, user, processPosts]);

  return { posts, loading, error };
}