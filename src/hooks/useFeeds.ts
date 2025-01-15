import { useState, useEffect } from 'react';
import { useAuthStore } from '../auth';
import { Feed } from '../types/feed';

const debugLog = (message: string, data?: any) => {
  console.log(`[Feeds] ${message}`, data || '');
};

export function useFeeds() {
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { agent, user } = useAuthStore();

  useEffect(() => {
    let mounted = true;

    async function fetchFeeds() {
      if (!agent || !user) return;

      try {
        debugLog('Starting feeds fetch');
        setLoading(true);

        // Create Following feed
        const followingFeed: Feed = {
          uri: 'following',
          cid: 'following',
          creator: {
            did: user.did,
            handle: user.handle,
            displayName: user.displayName || user.handle,
            avatar: user.avatar,
          },
          displayName: 'Following',
          description: 'Posts from accounts you follow',
          avatar: user.avatar,
          likeCount: 0,
          subscriberCount: 0,
          category: 'Personal'
        };

        // Fetch popular feeds and preferences in parallel
        const [feedsResponse, prefsResponse] = await Promise.all([
          agent.app.bsky.unspecced.getPopularFeedGenerators({
            limit: 100,
          }),
          agent.app.bsky.actor.getPreferences()
        ]);

        if (!mounted) return;

        // Get pinned feeds from preferences
        const savedFeedsPref = prefsResponse.data.preferences.find(
          (pref: any) => pref.$type === 'app.bsky.actor.defs#savedFeedsPrefV2'
        );
        const pinnedFeeds = new Set(
          savedFeedsPref?.items
            ?.filter((item: any) => item.type === 'feed')
            .map((item: any) => item.value) || []
        );

        debugLog('Processing popular feeds response');

        // Process feeds in parallel using Promise.all
        const popularFeeds = await Promise.all(
          feedsResponse.data.feeds.map(async feed => {
            // Check if feed is pinned
            const isPinned = pinnedFeeds.has(feed.uri);

            return {
              uri: feed.uri,
              cid: feed.cid,
              creator: {
                did: feed.creator.did,
                handle: feed.creator.handle,
                displayName: feed.creator.displayName || feed.creator.handle,
                avatar: feed.creator.avatar,
              },
              displayName: feed.displayName,
              description: feed.description || 'No description available',
              avatar: feed.avatar,
              likeCount: feed.likeCount || 0,
              subscriberCount: feed.viewerCount || 0,
              category: determineFeedCategory(feed.displayName + ' ' + (feed.description || '')),
              isPinned // Add pinned status
            };
          })
        );

        if (mounted) {
          // Combine Following feed with popular feeds
          setFeeds([followingFeed, ...popularFeeds]);
          setError(null);
        }
      } catch (err) {
        console.error('Error fetching feeds:', err);
        if (mounted) {
          setError('Failed to load feeds');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchFeeds();

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