import { useState, useEffect } from 'react';
import { useAuthStore } from '../auth';
import { Feed } from '../types/feed';

const debugLog = (message: string, data?: any) => {
  console.log(`[News Feeds] ${message}`, data ? JSON.stringify(data, null, 2) : '');
};

export function useNewsFeeds() {
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { agent } = useAuthStore();

  useEffect(() => {
    let mounted = true;

    async function fetchNewsFeeds() {
      debugLog('Starting news feeds fetch process');
      
      if (!agent) {
        debugLog('No agent available - authentication required');
        if (mounted) {
          setLoading(false);
          setError('Authentication required');
        }
        return;
      }

      try {
        if (mounted) {
          debugLog('Setting loading state to true');
          setLoading(true);
        }

        debugLog('Initiating API call to fetch all feeds');

        // Get all feeds using getPopularFeedGenerators with a high limit
        const response = await agent.app.bsky.unspecced.getPopularFeedGenerators({
          limit: 100,
        });

        debugLog('Raw API response received:', response.data);

        if (!response?.data?.feeds) {
          debugLog('Invalid response format - missing feeds array');
          throw new Error('Invalid response format');
        }

        debugLog(`Processing ${response.data.feeds.length} feeds from API response`);

        // Filter and transform feeds that contain "news" in their display name (case-insensitive)
        const newsFeeds = response.data.feeds
          .filter(feed => {
            const isNewsRelated = feed.displayName.toLowerCase().includes('news');
            debugLog(`Feed "${feed.displayName}" ${isNewsRelated ? 'matches' : 'does not match'} news criteria`);
            return isNewsRelated;
          })
          .map(feed => {
            debugLog(`Processing news feed: ${feed.displayName}`, {
              uri: feed.uri,
              creator: feed.creator.handle,
              likeCount: feed.likeCount,
              viewerCount: feed.viewerCount
            });

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
              category: 'News'
            };
          });

        debugLog(`Found ${newsFeeds.length} news feeds:`, newsFeeds.map(f => f.displayName));

        if (mounted) {
          debugLog('Updating state with processed news feeds');
          setFeeds(newsFeeds);
          setError(null);
        }
      } catch (err: any) {
        debugLog('Error encountered while fetching news feeds:', {
          error: err.message,
          status: err.status,
          stack: err.stack
        });
        
        if (mounted) {
          const errorMessage = err.message || 'Failed to load news feeds';
          debugLog(`Setting error state: ${errorMessage}`);
          setError(errorMessage);
          setFeeds([]);
        }
      } finally {
        if (mounted) {
          debugLog('Setting loading state to false');
          setLoading(false);
        }
      }
    }

    fetchNewsFeeds();

    return () => {
      debugLog('Component unmounting - cleanup');
      mounted = false;
    };
  }, [agent]);

  return { feeds, loading, error };
}