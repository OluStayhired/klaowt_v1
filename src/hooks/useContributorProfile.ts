import { useState, useEffect } from 'react';
import { useAuthStore } from '../auth';
import { subDays, startOfDay, endOfDay, parseISO, isEqual } from 'date-fns';

interface ContributorProfile {
  did: string;
  handle: string;
  displayName?: string;
  description?: string;
  avatar?: string;
  followersCount: number;
  followsCount: number;
  postStreak: number[];  // Last 30 days post counts
}

export function useContributorProfile(did: string) {
  const [profile, setProfile] = useState<ContributorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { agent } = useAuthStore();

  useEffect(() => {
    async function fetchProfile() {
      if (!agent) return;

      try {
        // Get basic profile information
        const profileResponse = await agent.getProfile({ actor: did });

        // Initialize array for the last 30 days
        const now = new Date();
        const thirtyDaysAgo = subDays(now, 30);
        const postsByDay = new Array(30).fill(0);
        const postDates = new Set<string>(); // Track unique posting dates

        // Use cursor-based pagination to fetch all posts within the time range
        let cursor: string | undefined;
        let hasMore = true;
        let totalPosts = 0;

        while (hasMore && totalPosts < 1000) { // Limit to prevent infinite loops
          const postsResponse = await agent.app.bsky.feed.getAuthorFeed({
            actor: did,
            limit: 100,
            cursor,
          });

          const posts = postsResponse.data.feed;
          
          // Check if we've reached posts older than 30 days
          if (posts.length === 0) break;
          
          const oldestPostDate = parseISO(posts[posts.length - 1].post.indexedAt);
          if (oldestPostDate < startOfDay(thirtyDaysAgo)) {
            hasMore = false;
          }

          // Process each post
          for (const item of posts) {
            const postDate = parseISO(item.post.indexedAt);
            
            // Skip posts older than 30 days
            if (postDate < startOfDay(thirtyDaysAgo)) {
              hasMore = false;
              break;
            }

            // Store the date string for streak calculation
            const dateString = startOfDay(postDate).toISOString();
            postDates.add(dateString);

            // Calculate day index (0-29, where 0 is today)
            const dayIndex = 29 - Math.floor(
              (endOfDay(now).getTime() - postDate.getTime()) / (1000 * 60 * 60 * 24)
            );

            if (dayIndex >= 0 && dayIndex < 30) {
              postsByDay[dayIndex]++;
            }

            totalPosts++;
          }

          cursor = postsResponse.data.cursor;
          hasMore = hasMore && !!cursor;
        }

        // Calculate consecutive posting days (streak)
        let currentDate = startOfDay(now);
        let streak = 0;
        
        while (streak < 30) {
          const dateString = currentDate.toISOString();
          if (!postDates.has(dateString)) {
            break;
          }
          streak++;
          currentDate = startOfDay(subDays(currentDate, 1));
        }

        // Update postsByDay to reflect streak information
        for (let i = 0; i < postsByDay.length; i++) {
          if (i < streak) {
            postsByDay[i] = postsByDay[i] || 1; // Ensure streak days show at least 1 post
          }
        }

        setProfile({
          did: profileResponse.data.did,
          handle: profileResponse.data.handle,
          displayName: profileResponse.data.displayName,
          description: profileResponse.data.description,
          avatar: profileResponse.data.avatar,
          followersCount: profileResponse.data.followersCount,
          followsCount: profileResponse.data.followsCount,
          postStreak: postsByDay
        });
        setError(null);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [agent, did]);

  return { profile, loading, error };
}