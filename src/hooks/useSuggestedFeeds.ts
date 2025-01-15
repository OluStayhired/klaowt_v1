import { useState, useEffect } from 'react';
import { useAuthStore } from '../auth';
import { Feed } from '../types/feed';

export function useSuggestedFeeds() {
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { agent } = useAuthStore();

  useEffect(() => {
    async function fetchSuggestedFeeds() {
      if (!agent) return;

      try {
        setLoading(true);
        const response = await agent.app.bsky.feed.getSuggestedFeeds();

        const suggestedFeeds = response.data.feeds.map(feed => ({
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
        }));

        setFeeds(suggestedFeeds);
        setError(null);
      } catch (err) {
        console.error('Error fetching suggested feeds:', err);
        setError('Failed to load suggested feeds');
      } finally {
        setLoading(false);
      }
    }

    fetchSuggestedFeeds();
  }, [agent]);

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