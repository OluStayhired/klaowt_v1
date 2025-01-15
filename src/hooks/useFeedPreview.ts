import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../../auth';
import { FeedAlgorithm, PostWithMatch, KeywordMatch } from '../types';

const debugLog = (message: string, data?: any) => {
  console.log(`[Feed Preview] ${message}`, data ? JSON.stringify(data, null, 2) : '');
};

function calculateKeywordMatch(text: string, keywords: string[]): KeywordMatch {
  if (!keywords.length) return { percentage: 0, matchedWords: [] };
  
  const postText = text.toLowerCase();
  const matchedWords = keywords.filter(keyword => postText.includes(keyword.toLowerCase()));
  const percentage = (matchedWords.length / keywords.length) * 100;

  debugLog('Keyword match calculation', {
    text: text.substring(0, 100) + '...',
    keywords,
    matchedWords,
    percentage
  });

  return { percentage, matchedWords };
}

export function useFeedPreview(algorithm: FeedAlgorithm) {
  const [posts, setPosts] = useState<PostWithMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { agent } = useAuthStore();

  useEffect(() => {
    let mounted = true;

    async function fetchPreviewPosts() {
      if (!agent || !algorithm || Object.keys(algorithm).length === 0) {
        debugLog('Missing required data', { hasAgent: !!agent, algorithm });
        return;
      }

      try {
        setLoading(true);
        setError(null);

        debugLog('Starting feed preview with algorithm', algorithm);

        const response = await agent.getTimeline({
          limit: 100 // Reduced from 200 to 100
        });

        if (!mounted) return;

        debugLog('Raw timeline response', {
          totalPosts: response.data.feed.length
        });

        const processedPosts = response.data.feed
          .map((item, index) => {
            debugLog(`Processing post ${index + 1}/${response.data.feed.length}`, {
              uri: item.post.uri,
              author: item.post.author.handle,
              text: item.post.record.text?.substring(0, 100) + '...',
              likes: item.post.likeCount,
              reposts: item.post.repostCount,
              replies: item.post.replyCount,
              timestamp: item.post.indexedAt
            });

            // Calculate keyword match
            const keywordMatch = calculateKeywordMatch(
              item.post.record.text || '',
              algorithm.keywords || []
            );

            // Check interaction thresholds
            const meetsLikeThreshold = !algorithm.interactionThresholds?.minLikes || 
              (item.post.likeCount || 0) >= algorithm.interactionThresholds.minLikes;
            
            const meetsRepostThreshold = !algorithm.interactionThresholds?.minReposts || 
              (item.post.repostCount || 0) >= algorithm.interactionThresholds.minReposts;

            debugLog('Post metrics', {
              uri: item.post.uri,
              keywordMatchPercentage: keywordMatch.percentage,
              matchedWords: keywordMatch.matchedWords,
              likes: item.post.likeCount,
              meetsLikeThreshold,
              reposts: item.post.repostCount,
              meetsRepostThreshold
            });

            // Only include posts that meet all criteria
            if (keywordMatch.percentage < 5 || !meetsLikeThreshold || !meetsRepostThreshold) {
              debugLog('Post filtered out', {
                uri: item.post.uri,
                reason: {
                  lowKeywordMatch: keywordMatch.percentage < 5,
                  failsLikeThreshold: !meetsLikeThreshold,
                  failsRepostThreshold: !meetsRepostThreshold
                }
              });
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
              keywordMatch
            };
          })
          .filter((post): post is PostWithMatch => post !== null)
          .sort((a, b) => b.keywordMatch.percentage - a.keywordMatch.percentage);

        debugLog('Final processed posts', {
          totalMatching: processedPosts.length,
          topMatches: processedPosts.slice(0, 3).map(post => ({
            uri: post.uri,
            matchPercentage: post.keywordMatch.percentage,
            matchedWords: post.keywordMatch.matchedWords
          }))
        });

        if (mounted) {
          setPosts(processedPosts.slice(0, 20));
          setError(null);
        }
      } catch (err: any) {
        console.error('Error fetching preview posts:', err);
        if (mounted) {
          setError('Failed to load preview posts. Please try again.');
          setPosts([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchPreviewPosts();

    return () => {
      mounted = false;
    };
  }, [agent, algorithm]);

  return { posts, loading, error };
}