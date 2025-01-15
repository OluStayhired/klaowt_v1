import { useState, useEffect } from 'react';
import { useAuthStore } from '../auth';
import { ContributorStats } from '../types/contributor';
import { subDays, startOfDay, endOfDay } from 'date-fns';

export function useContributorStats(did: string) {
  const [stats, setStats] = useState<ContributorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { agent } = useAuthStore();

  useEffect(() => {
    async function fetchStats() {
      if (!agent) return;

      try {
        const now = new Date();
        const oneDayAgo = subDays(now, 1);
        const threeDaysAgo = subDays(now, 3);
        const sevenDaysAgo = subDays(now, 7);

        // Get basic profile information
        const profileResponse = await agent.getProfile({ actor: did });

        // Initialize stats structure
        const stats: ContributorStats['stats'] = {
          posts: { last24h: 0, last3d: 0, last7d: 0 },
          likes: { last24h: 0, last3d: 0, last7d: 0 },
          shares: { last24h: 0, last3d: 0, last7d: 0 },
          comments: { last24h: 0, last3d: 0, last7d: 0 }
        };

        // Fetch posts with cursor pagination
        let cursor: string | undefined;
        let hasMore = true;

        while (hasMore) {
          const feedResponse = await agent.app.bsky.feed.getAuthorFeed({
            actor: did,
            limit: 100,
            cursor,
          });

          const posts = feedResponse.data.feed;
          
          // Process each post
          for (const post of posts) {
            const postDate = new Date(post.post.indexedAt);
            
            // Skip posts older than 7 days
            if (postDate < startOfDay(sevenDaysAgo)) {
              hasMore = false;
              break;
            }

            // Count posts
            if (postDate >= startOfDay(oneDayAgo)) stats.posts.last24h++;
            if (postDate >= startOfDay(threeDaysAgo)) stats.posts.last3d++;
            if (postDate >= startOfDay(sevenDaysAgo)) stats.posts.last7d++;

            // Count interactions
            if (post.post.replyCount) {
              if (postDate >= startOfDay(oneDayAgo)) stats.comments.last24h += post.post.replyCount;
              if (postDate >= startOfDay(threeDaysAgo)) stats.comments.last3d += post.post.replyCount;
              if (postDate >= startOfDay(sevenDaysAgo)) stats.comments.last7d += post.post.replyCount;
            }

            if (post.post.repostCount) {
              if (postDate >= startOfDay(oneDayAgo)) stats.shares.last24h += post.post.repostCount;
              if (postDate >= startOfDay(threeDaysAgo)) stats.shares.last3d += post.post.repostCount;
              if (postDate >= startOfDay(sevenDaysAgo)) stats.shares.last7d += post.post.repostCount;
            }

            if (post.post.likeCount) {
              if (postDate >= startOfDay(oneDayAgo)) stats.likes.last24h += post.post.likeCount;
              if (postDate >= startOfDay(threeDaysAgo)) stats.likes.last3d += post.post.likeCount;
              if (postDate >= startOfDay(sevenDaysAgo)) stats.likes.last7d += post.post.likeCount;
            }
          }

          cursor = feedResponse.data.cursor;
          hasMore = hasMore && !!cursor;
        }

        setStats({
          did: profileResponse.data.did,
          handle: profileResponse.data.handle,
          displayName: profileResponse.data.displayName,
          avatar: profileResponse.data.avatar,
          stats
        });
        
      } catch (err) {
        console.error('Error fetching contributor stats:', err);
        setError('Failed to load contributor statistics');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [agent, did]);

  return { stats, loading, error };
}