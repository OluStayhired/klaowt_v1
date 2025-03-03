import { useState, useEffect } from 'react';
import { useAuthStore } from '../auth';
import { User } from '../types/user';

export function useUserSuggested(userDid: string) {
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { agent } = useAuthStore();

  useEffect(() => {
    let mounted = true;

    async function fetchSuggestedUsers() {
      if (!agent) return;

      try {
        setLoading(true);

        // Get user's followers and following
        const [followersResponse, followingResponse] = await Promise.all([
          agent.getFollowers({ actor: userDid }),
          agent.getFollows({ actor: userDid })
        ]);

        // Create sets for efficient lookup
        const followers = new Set(followersResponse.data.followers.map(f => f.did));
        const following = new Set(followingResponse.data.follows.map(f => f.did));

        // Get followers' followers to find similar users
        const suggestedProfiles = new Map<string, User>();
        const processedUsers = new Set<string>();

        // Process each follower
        for (const follower of followersResponse.data.followers) {
          if (processedUsers.size >= 50) break; // Limit processing

          try {
            // Get follower's followers
            const followerFollowersResponse = await agent.getFollowers({
              actor: follower.did,
              limit: 20
            });

            // Process each potential suggestion
            for (const suggestion of followerFollowersResponse.data.followers) {
              // Skip if already processed or is the original user
              if (processedUsers.has(suggestion.did) || suggestion.did === userDid) continue;
              
              // Skip if already following or is a follower
              if (following.has(suggestion.did) || followers.has(suggestion.did)) continue;

              try {
                // Get detailed profile and engagement data
                const [profile, feed] = await Promise.all([
                  agent.getProfile({ actor: suggestion.did }),
                  agent.getAuthorFeed({ actor: suggestion.did, limit: 20 })
                ]);

                // Calculate engagement metrics
                const posts = feed.data.feed;
                const totalLikes = posts.reduce((sum, post) => sum + (post.post.likeCount || 0), 0);
                const totalReposts = posts.reduce((sum, post) => sum + (post.post.repostCount || 0), 0);
                const totalReplies = posts.reduce((sum, post) => sum + (post.post.replyCount || 0), 0);
                const engagementScore = Math.min(
                  Math.round(((totalLikes + totalReposts * 2 + totalReplies * 3) / posts.length) * 10),
                  100
                );

                suggestedProfiles.set(suggestion.did, {
                  did: suggestion.did,
                  handle: suggestion.handle,
                  displayName: suggestion.displayName,
                  avatar: suggestion.avatar,
                  description: profile.data.description,
                  followersCount: profile.data.followersCount,
                  followsCount: profile.data.followsCount,
                  postsCount: profile.data.postsCount,
                  engagementScore,
                  interactions: {
                    likes: totalLikes,
                    reposts: totalReposts,
                    comments: totalReplies,
                    total: totalLikes + totalReposts + totalReplies
                  },
                  myInteractions: {
                    liked: false,
                    reposted: false,
                    commented: false
                  }
                });

                processedUsers.add(suggestion.did);
                if (processedUsers.size >= 50) break;
              } catch (err) {
                console.warn('Error processing suggestion:', err);
                continue;
              }
            }
          } catch (err) {
            console.warn('Error processing follower:', err);
            continue;
          }
        }

        if (mounted) {
          // Sort by engagement score and limit to top 10
          setSuggestedUsers(
            Array.from(suggestedProfiles.values())
              .sort((a, b) => b.engagementScore - a.engagementScore)
              .slice(0, 10)
          );
        }
      } catch (err) {
        console.error('Error fetching suggested users:', err);
        if (mounted) {
          setError('Failed to load suggested users');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchSuggestedUsers();

    return () => {
      mounted = false;
    };
  }, [agent, userDid]);

  return { suggestedUsers, loading, error };
}