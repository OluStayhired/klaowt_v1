// src/hooks/useActivityHours.ts
import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../auth';

interface ActivityHourData {
  hour: number;
  count: number;
  percentage: number;
}

interface ActivityHourStats {
  topHours: ActivityHourData[];
  totalInteractions: number;
}

export function useActivityHours() {
  const [activityStats, setActivityStats] = useState<ActivityHourStats>({
    topHours: [],
    totalInteractions: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { agent } = useAuthStore();

  // Add cache configuration
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const activityCache = new Map<string, {
  data: ActivityHourStats;
  timestamp: number;
}>();

// Add cache check and update logic
const getCachedData = (userId: string) => {
  const cached = activityCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

const updateCache = (userId: string, data: ActivityHourStats) => {
  activityCache.set(userId, {
    data,
    timestamp: Date.now()
  });
};

// Add rate limit configuration
const RATE_LIMIT = {
  MAX_REQUESTS: 100,
  WINDOW: 60 * 1000, // 1 minute
  requestCount: 0,
  windowStart: Date.now()
};

// Add rate limit check function
const checkRateLimit = () => {
  const now = Date.now();
  if (now - RATE_LIMIT.windowStart >= RATE_LIMIT.WINDOW) {
    RATE_LIMIT.requestCount = 0;
    RATE_LIMIT.windowStart = now;
  }
  if (RATE_LIMIT.requestCount >= RATE_LIMIT.MAX_REQUESTS) {
    throw new Error('Rate limit exceeded');
  }
  RATE_LIMIT.requestCount++;
};

const handleError = (err: any) => {
  if (err.message === 'Rate limit exceeded') {
    // Use cached data if available
    const cached = getCachedData(agent?.session?.did);
    if (cached) {
      setActivityStats(cached);
      return;
    }
  }
  console.error('Error fetching activity data:', err);
  setError('Failed to load activity data');
};

const retryWithBackoff = async (fn: () => Promise<void>, retries = 3) => {
  try {
    await fn();
  } catch (err) {
    if (retries === 0) throw err;
    await new Promise(resolve => setTimeout(resolve, Math.pow(2, 4 - retries) * 1000));
    await retryWithBackoff(fn, retries - 1);
  }
};
  
  
  const fetchActivityData = useCallback(async () => {
  if (!agent) return;
  
  try {
    // Check cache first
    const cached = getCachedData(agent.session?.did);
    if (cached) {
      setActivityStats(cached);
      return;
    }

    setLoading(true);
    checkRateLimit();

    const timeline = await agent.getAuthorFeed({
      actor: agent.session?.handle,
      limit: 100
    });

    const hourlyActivity = new Map<number, number>();
    for (let i = 0; i < 24; i++) {
      hourlyActivity.set(i, 0);
    }

    await processBatch(timeline.data.feed, hourlyActivity);

    const stats = calculateStats(hourlyActivity);
    setActivityStats(stats);
    updateCache(agent.session?.did, stats);

  } catch (err) {
    handleError(err);
  } finally {
    setLoading(false);
  }
}, [agent]);


  return { activityStats, loading, error };
}
