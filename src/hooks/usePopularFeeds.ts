import { useState, useEffect } from 'react';
import { useAuthStore } from '../auth';
import { Feed } from '../types/feed';

// Define proper interfaces for type safety
interface FeedResponse {
  uri: string;
  displayName: string;
  description?: string;
  creator: {
    did: string;
    handle: string;
    displayName?: string;
    avatar?: string;
  };
  avatar?: string;
  likeCount?: number;
  viewerCount?: number;
}

interface CacheEntry {
  data: FeedResponse[];
  timestamp: number;
}

interface RateLimit {
  count: number;
  resetTime: number;
}

// Cache and rate limiting constants
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 5; // Max requests per minute

// Cache and rate limit tracking
const feedCache: { [key: string]: CacheEntry } = {};
const rateLimit: RateLimit = {
  count: 0,
  resetTime: Date.now() + RATE_LIMIT_WINDOW
};

// Suggested new hook: usePopularFeeds
export function usePopularFeeds() {
  const [feeds, setFeeds] = useState<{[key: string]: Feed}>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { agent } = useAuthStore();

// Add caching and rate limiting
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 5; // Max requests per minute

interface CacheEntry {
  data: any;
  timestamp: number;
}  

interface RateLimit {
  count: number;
  resetTime: number;
}  

// Cache and rate limit tracking
const feedCache: { [key: string]: CacheEntry } = {};
const rateLimit: RateLimit = {
  count: 0,
  resetTime: Date.now() + RATE_LIMIT_WINDOW
};  

const checkRateLimit = () => {
  const now = Date.now();
  if (now > rateLimit.resetTime) {
    // Reset rate limit window
    rateLimit.count = 0;
    rateLimit.resetTime = now + RATE_LIMIT_WINDOW;
  }
  if (rateLimit.count >= MAX_REQUESTS) {
    throw new Error('Rate limit exceeded');
  }
  rateLimit.count++;
};

const getCachedFeeds = () => {
  const cacheEntry = feedCache['popular'];
  if (cacheEntry && Date.now() - cacheEntry.timestamp < CACHE_DURATION) {
    return cacheEntry.data;
  }
  return null;
};
    
  // Fetch feeds and categorize them
  const fetchFeeds = async () => {
    try {

          // Check cache first
          const cachedData = getCachedFeeds();
          if (cachedData) 
          {
          setFeeds(cachedData);
          return;
          }

          // Check rate limit before making request
          checkRateLimit();
      const response = await agent.app.bsky.unspecced.getPopularFeedGenerators({
        limit: 50,
      });

          // Cache the response
          feedCache['popular'] = {
          data: response.data.feeds,
          timestamp: Date.now()
          };

  // Organize feeds by category/type
  const categorizedFeeds = {
  mutuals: response.data.feeds.find(feed => {
    const lowerName = (feed?.displayName || 'Unknown Feed').toLowerCase();
    const lowerDesc = (feed.description || '').toLowerCase();
    return (feed.uri.includes('app.bsky.feed.generator/mutuals') || feed.uri === 'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/mutuals'
    );
  }),
  quiets: response.data.feeds.find(feed => {
    const lowerName = (feed?.displayName || 'Unknown Feed').toLowerCase();
    const lowerDesc = (feed?.description || '').toLowerCase();

    return (feed.uri.includes('app.bsky.feed.generator/infreq') || feed.uri === 'at://did:plc:vpkhqolt662uhesyj6nxm7ys/app.bsky.feed.generator/infreq'
    );
  }),
  popular: response.data.feeds.find(feed => {
    const lowerName = (feed?.displayName || 'Unknown Feed').toLowerCase();
    const lowerDesc = (feed?.description || '').toLowerCase();
    return (feed.uri.includes('app.bsky.feed.generator/with-friends') || feed.uri === 'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/with-friends'
    );
  }),
 mentions: response.data.feeds.find(feed => {
    const lowerName = (feed?.displayName || 'Unknown Feed').toLowerCase();
    const lowerDesc = (feed?.description || '').toLowerCase();
    return (feed.uri.includes('app.bsky.feed.generator/mentions') || 
feed.uri === 'at://did:plc:wzsilnxf24ehtmmc3gssy5bu/app.bsky.feed.generator/mentions'
    );
  }),

  // ... other feed categories
};

     setFeeds(categorizedFeeds);
      } catch (err) {
        if (err.message === 'Rate limit exceeded') {
          // Use cached data if available when rate limited
          const cachedData = getCachedFeeds();
          if (cachedData) {
          setFeeds(cachedData);
          return;
          }
      }
          setError('Failed to fetch feeds');
          console.error(err);
      } finally {
      setLoading(false);
      }
  };

  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const fetchWithRetry = async (retries = 3, backoff = 1000) => {
  try {
    return await fetchFeeds();
  } catch (err) {
    if (retries === 0 || err.message !== 'Rate limit exceeded') throw err;
    await wait(backoff);
    return fetchWithRetry(retries - 1, backoff * 2);
  }
};


  return { feeds, loading, error, refetchFeeds: fetchFeeds };
}
