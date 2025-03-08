// src/hooks/useFollowerGrowth.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuthStore } from '../auth';
import { format, subDays, startOfDay, parseISO } from 'date-fns';

interface DailyHighestPost {
    text: string;
    engagement: number;
    timestamp: string;
}


interface HighestEngagementPost {
    text: string;
    engagement: number;
}

interface FollowerGrowthData {
    followers: {
        count: number;
        timestamp: string;
        engagement: number;
    }[];
    metrics: {
        totalFollowers: number;
        totalFollowing: number;
        growthRate: number;
        engagementRate: number;
    };
    dailyHighestPosts: {
        [date: string]: DailyHighestPost | null; // Changed to POJO
    };
    highestEngagementPost: HighestEngagementPost | null;
}

// Cache configuration
const CACHE_KEY = 'follower_growth_';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export function useFollowerGrowth(did: string, 
  timeRange: '7d' | '30d' | '90d' | 'all' = '7d') {
  const [data, setData] = useState<FollowerGrowthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { agent } = useAuthStore();
// New state for time range
//const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('7d');
  
  const getCachedData = useCallback((key: string) => {
    try {
      const cached = localStorage.getItem(`${CACHE_KEY}${key}`);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp > CACHE_DURATION) {
        localStorage.removeItem(`${CACHE_KEY}${key}`);
        return null;
      }

      return data;
    } catch (err) {
      return null;
    }
  }, []);

  const setCachedData = useCallback((key: string, data: FollowerGrowthData) => {
    try {
      localStorage.setItem(`${CACHE_KEY}${key}`, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (err) {
      console.warn('Failed to cache data:', err);
    }
  }, []);

  function wrapText(text, charsPerLine) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';

        words.forEach(word => {
            if (currentLine.length + word.length + 1 <= charsPerLine) {
                currentLine += (currentLine ? ' ' : '') + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        });

        if (currentLine) {
            lines.push(currentLine);
        }

        return lines;
    }
  
  const calculateMetrics = useCallback((
    profile: any,
    dailyStats: Map<string, { engagement: number; followers: number }>
  ) => {
    const entries = Array.from(dailyStats.entries());
    
    // Calculate growth rate
    const oldestCount = entries[0]?.[1].followers || 0;
    const newestCount = profile.followersCount;
    const growthRate = oldestCount > 0 
      ? ((newestCount - oldestCount) / oldestCount) * 100 
      : 0;

    // Calculate engagement rate using current follower count
    const totalEngagement = entries.reduce((sum, [_, stats]) => sum + stats.engagement, 0);
    const avgEngagementPerPost = entries.length > 0 ? totalEngagement / entries.length : 0;
    const engagementRate = profile.followersCount > 0 
      ? (avgEngagementPerPost / profile.followersCount) * 100 
      : 0;

    return {
      totalFollowers: profile.followersCount,
      totalFollowing: profile.followsCount,
      growthRate,
      engagementRate
    };
  }, []);

  const fetchGrowthData = useCallback(async () => {
    if (!agent || !did) return;

    try {
      // Check cache first
      const cached = getCachedData(did);
      if (cached) {
        setData(cached);
        setLoading(false);
        return;
      }

      setLoading(true);

      // Get profile data
      const profile = await agent.getProfile({ actor: did });

      // Get recent posts
      const timeline = await agent.getAuthorFeed({
        actor: did,
        limit: 50,
        filter: 'posts_no_replies'
      });

      // Process posts with daily stats
      const dailyStats = new Map<string, { engagement: number; followers: number }>();

      // Process posts in batches of 10
      const posts = timeline.data.feed;
      const batchSize = 10;
      
      //const dailyHighestPosts = new Map<string, DailyHighestPost | null>();
      const dailyHighestPosts: { [date: string]: DailyHighestPost | null } = {}; // Initialize as POJO
       let highestEngagementPost: HighestEngagementPost | null = null; // Track highest post
      
      for (let i = 0; i < posts.length; i += batchSize) {
        const batch = posts.slice(i, i + batchSize);
        
        await Promise.all(batch.map(async (item) => {
          const post = item.post;
          const postDate = startOfDay(parseISO(post.indexedAt));
          //const dateKey = postDate.toISOString();
          const dateKey = format(postDate, 'MMM d'); // Format date as 'MMM d'
          // Create an ISO formatted date key
          const isoDateKey = postDate.toISOString();

          // Get engagement metrics in parallel
          const [likes, reposts, thread] = await Promise.all([
            agent.getLikes({ uri: post.uri }),
            agent.getRepostedBy({ uri: post.uri }),
            agent.getPostThread({ uri: post.uri, depth: 1 })
          ]);

          // Calculate engagement score
          const engagement = 
            likes.data.likes.length + 
            (reposts.data.repostedBy.length * 2) + 
            ((thread.data.thread.replies?.length || 0) * 3);

// Track daily highest engagement post
            const existingHighest = dailyHighestPosts[dateKey]; // Access with bracket notation
            if (!existingHighest || engagement > existingHighest?.engagement) {
                dailyHighestPosts[dateKey] = {
                    text: post.record.text,
                    engagement: engagement,
                    timestamp: post.indexedAt
                };
            }
          
          // Track highest engagement post
          if (!highestEngagementPost || engagement > highestEngagementPost.engagement) {
                highestEngagementPost = {
                text: post.record.text,
                engagement: engagement
                        };
          }
          // Update daily stats
          const existing = dailyStats.get(isoDateKey) || {
            engagement: 0,
            followers: profile.data.followersCount
          };

          dailyStats.set(isoDateKey, {
            engagement: existing.engagement + engagement,
            followers: existing.followers
          });
        }));
      }

      // Calculate metrics
      const metrics = calculateMetrics(profile.data, dailyStats);

      // Format final data
      const growthData: FollowerGrowthData = {
        followers: Array.from(dailyStats.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([isoDateKey, stats]) => ({
            timestamp: isoDateKey,
            count: stats.followers,
            engagement: stats.engagement
          })),
        metrics,
        dailyHighestPosts: dailyHighestPosts,
       highestEngagementPost: highestEngagementPost // Add highest post data
        
      };

console.log("dailyHighestPosts before setData:", dailyHighestPosts); // Add this line

      setData(growthData);
      setCachedData(did, growthData);

    } catch (err) {
      console.error('Error fetching growth data:', err);
      setError('Failed to load growth data');
    } finally {
      setLoading(false);
    }
  }, [agent, did, getCachedData, setCachedData, calculateMetrics]);

// Add this after the fetchGrowthData callback but before calculateFilteredMetrics
const filteredData = useMemo(() => {
  if (!data?.followers) return [];
  
  // Filter data based on timeRange
  const now = new Date();
  let filterDate;
  
  switch (timeRange) {
    case '7d':
      filterDate = subDays(now, 7);
      break;
    case '30d':
      filterDate = subDays(now, 30);
      break;
    case '90d':
      filterDate = subDays(now, 90);
      break;
    default: // 'all'
      return data.followers;
  }

  return data.followers.filter(d => 
    parseISO(d.timestamp) >= startOfDay(filterDate)
  );
}, [data?.followers, timeRange]);




  
  //Add the code for filtered data here
const calculateFilteredMetrics = useCallback((data, totalFollowers) => {
  if (!data?.length) return null;
  
  const totalEngagement = data.reduce((sum, d) => sum + d.engagement, 0);
  const avgEngagement = totalEngagement / data.length;
  
  return {
    engagementRate: (avgEngagement / totalFollowers) * 100
  };
}, []);

const filteredMetrics = useMemo(() => 
  calculateFilteredMetrics(
    filteredData, 
    data?.metrics?.totalFollowers
  ), 
  [filteredData, data?.metrics?.totalFollowers, calculateFilteredMetrics]
);


  // end of filtered data code here
  
  useEffect(() => {
    fetchGrowthData();
  }, [fetchGrowthData]);

  return { data, loading, error };
}
