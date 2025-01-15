import { useState, useEffect } from 'react';
import { useAuthStore } from '../auth';
import { Post } from '../types/post';
import { ContributorStats } from '../types/contributor';
import { addDays, parseISO, startOfDay, endOfDay, subDays } from 'date-fns';

interface AnalyticsData {
  activityLevels: {
    totalPosts: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
  };
  topContributors: ContributorStats[];
  topPosts: Post[];
  activityByHour: {
    [hour: string]: number;
  };
}

export function useAnalytics(feedUri: string, period: '7d' | '14d' | '30d' = '7d') {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { agent } = useAuthStore();

  useEffect(() => {
    let mounted = true;

    async function fetchAnalytics() {
      if (!agent) return;

      try {
        setLoading(true);
        setError(null);

        let response;

        // Handle different feed types
        if (feedUri === 'following') {
          response = await agent.getTimeline({ limit: 100 });
        } else if (feedUri === 'discover') {
          response = await agent.app.bsky.feed.getPopular({ limit: 100 });
        } else {
          response = await agent.app.bsky.feed.getFeed({
            feed: feedUri,
            limit: 100,
          });
        }

        if (!response?.data?.feed) {
          throw new Error('Invalid feed response');
        }

        const now = new Date();
        const sevenDaysAgo = subDays(now, 7);

        // Map and filter posts
        const posts = response.data.feed
          .map((item: any) => ({
            uri: item.post.uri,
            cid: item.post.cid,
            author: item.post.author,
            record: item.post.record,
            replyCount: item.post.replyCount || 0,
            repostCount: item.post.repostCount || 0,
            likeCount: item.post.likeCount || 0,
            indexedAt: item.post.indexedAt,
          }))
          .filter(post => {
            const postDate = parseISO(post.indexedAt);
            return postDate >= startOfDay(sevenDaysAgo);
          });

        // Calculate metrics
        const totalPosts = posts.length;
        const totalLikes = posts.reduce((sum, post) => sum + post.likeCount, 0);
        const totalComments = posts.reduce((sum, post) => sum + post.replyCount, 0);
        const totalShares = posts.reduce((sum, post) => sum + post.repostCount, 0);

        // Process contributor stats
        const contributorMap = new Map<string, ContributorStats>();
        
        posts.forEach(post => {
          const { author } = post;
          const postDate = new Date(post.indexedAt);
          const oneDayAgo = subDays(now, 1);
          const threeDaysAgo = subDays(now, 3);

          if (!contributorMap.has(author.did)) {
            contributorMap.set(author.did, {
              did: author.did,
              handle: author.handle,
              displayName: author.displayName,
              avatar: author.avatar,
              stats: {
                posts: { last24h: 0, last3d: 0, last7d: 0 },
                likes: { last24h: 0, last3d: 0, last7d: 0 },
                shares: { last24h: 0, last3d: 0, last7d: 0 },
                comments: { last24h: 0, last3d: 0, last7d: 0 }
              }
            });
          }

          const stats = contributorMap.get(author.did)!.stats;

          // Update post counts
          if (postDate >= startOfDay(oneDayAgo)) stats.posts.last24h++;
          if (postDate >= startOfDay(threeDaysAgo)) stats.posts.last3d++;
          stats.posts.last7d++;

          // Update interaction counts
          if (post.likeCount) {
            if (postDate >= startOfDay(oneDayAgo)) stats.likes.last24h += post.likeCount;
            if (postDate >= startOfDay(threeDaysAgo)) stats.likes.last3d += post.likeCount;
            stats.likes.last7d += post.likeCount;
          }

          if (post.repostCount) {
            if (postDate >= startOfDay(oneDayAgo)) stats.shares.last24h += post.repostCount;
            if (postDate >= startOfDay(threeDaysAgo)) stats.shares.last3d += post.repostCount;
            stats.shares.last7d += post.repostCount;
          }

          if (post.replyCount) {
            if (postDate >= startOfDay(oneDayAgo)) stats.comments.last24h += post.replyCount;
            if (postDate >= startOfDay(threeDaysAgo)) stats.comments.last3d += post.replyCount;
            stats.comments.last7d += post.replyCount;
          }
        });

        const topContributors = Array.from(contributorMap.values())
          .sort((a, b) => b.stats.posts.last7d - a.stats.posts.last7d)
          .slice(0, 20);

        // Calculate activity by hour
        const activityByHour: { [hour: string]: number } = {};
        posts.forEach(post => {
          const date = new Date(post.indexedAt);
          const hour = date.getHours().toString().padStart(2, '0');
          activityByHour[hour] = (activityByHour[hour] || 0) + 1;
        });

        if (mounted) {
          setData({
            activityLevels: {
              totalPosts,
              totalLikes,
              totalComments,
              totalShares,
            },
            topContributors,
            topPosts: posts.sort((a, b) => b.likeCount - a.likeCount),
            activityByHour,
          });
          setError(null);
        }
      } catch (err) {
        console.error('Error fetching analytics:', err);
        if (mounted) {
          setError('Failed to load analytics data');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchAnalytics();

    return () => {
      mounted = false;
    };
  }, [agent, feedUri, period]);

  return { data, loading, error };
}