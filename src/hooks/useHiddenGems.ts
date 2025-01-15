import { useState, useEffect } from 'react';
import { useAuthStore } from '../auth';
import { Feed } from '../types/feed';
import { getPinnedFeeds } from '../utils/preferences';

export function useHiddenGems() {
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { agent, user } = useAuthStore();

  useEffect(() => {
    let mounted = true;

    async function fetchHiddenGems() {
      if (!agent || !user) {
        if (mounted) {
          setLoading(false);
          setError('Authentication required');
        }
        return;
      }

      try {
        if (mounted) setLoading(true);
        
        // Get user's pinned feeds
        const pinnedFeeds = await getPinnedFeeds(agent);

        // Get followers and following to find mutuals
        const [followersResponse, followingResponse] = await Promise.all([
          agent.getFollowers({ actor: user.handle }),
          agent.getFollows({ actor: user.handle })
        ]);

        // Create sets of followers and following
        const followers = new Set(followersResponse.data.followers.map((f: any) => f.did));
        const following = new Set(followingResponse.data.follows.map((f: any) => f.did));

        // Find mutual follows
        const mutuals = followingResponse.data.follows.filter(f => followers.has(f.did))
          .sort((a, b) => (b.followersCount || 0) - (a.followersCount || 0))
          .slice(0, 20);

        // Track unique feeds and their popularity
        const feedMap = new Map<string, { count: number; feedData: any }>();
        const processedMutuals = new Set<string>();

        // Process each mutual's feeds
        for (const mutual of mutuals) {
          if (processedMutuals.has(mutual.handle)) continue;
          
          try {
            const feedsResponse = await agent.app.bsky.feed.getActorFeeds({
              actor: mutual.handle,
              limit: 100
            });

            if (!feedsResponse?.data?.feeds) continue;

            // Process each feed
            for (const feed of feedsResponse.data.feeds) {
              if (!feed.uri || pinnedFeeds.has(feed.uri)) continue;

              const existing = feedMap.get(feed.uri);
              if (existing) {
                existing.count++;
              } else {
                feedMap.set(feed.uri, { count: 1, feedData: feed });
              }
            }

            processedMutuals.add(mutual.handle);
          } catch (err) {
            console.warn(`Failed to process mutual ${mutual.handle}:`, err);
            continue;
          }
        }

        if (mounted) {
          // Convert to array and sort by popularity
          const sortedFeeds = Array.from(feedMap.entries())
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 20)
            .map(([uri, { feedData }]) => ({
              uri: feedData.uri,
              cid: feedData.cid,
              creator: {
                did: feedData.creator.did,
                handle: feedData.creator.handle,
                displayName: feedData.creator.displayName || feedData.creator.handle,
                avatar: feedData.creator.avatar,
              },
              displayName: feedData.displayName,
              description: feedData.description || 'No description available',
              avatar: feedData.avatar,
              likeCount: feedData.likeCount || 0,
              subscriberCount: feedData.viewerCount || 0,
              category: determineFeedCategory(feedData.displayName + ' ' + (feedData.description || '')),
            }));

          setFeeds(sortedFeeds);
          setError(null);
        }
      } catch (err: any) {
        console.error('Error fetching hidden gems:', err);
        if (mounted) {
          setError(err.message || 'Failed to load hidden gems');
          setFeeds([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchHiddenGems();

    return () => {
      mounted = false;
    };
  }, [agent, user]);

  return { feeds, loading, error };
}

function determineFeedCategory(text: string): string {
  const categories = {
    Technology: ['tech', 'coding', 'programming', 'developer', 'software', 'ai', 'web3', 'crypto'],
    Gaming: ['game', 'gaming', 'esports', 'twitch', 'streamer'],
    News: ['news', 'breaking', 'headlines', 'daily', 'update', 'verified'],
    Entertainment: ['entertainment', 'movies', 'music', 'tv', 'film', 'celebrity'],
    Sports: ['sports', 'football', 'basketball', 'soccer', 'nfl', 'nba', 'mlb'],
    Science: ['science', 'research', 'academic', 'space', 'physics'],
    Art: ['art', 'design', 'creative', 'photography', 'illustration'],
    Business: ['business', 'finance', 'economy', 'market', 'startup'],
    Community: ['community', 'social', 'group', 'club', 'network', 'black', 'culture'],
    Lifestyle: ['lifestyle', 'fashion', 'food', 'travel', 'health'],
  };

  const lowerText = text.toLowerCase();
  
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      return category;
    }
  }

  return 'Other';
}