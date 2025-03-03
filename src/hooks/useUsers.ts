import { useState, useEffect } from 'react';
import { useAuthStore } from '../auth';
import { User } from '../types/user';

export function useUsers() {
    const { agent } = useAuthStore();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
    let mounted = true;// new line

      
        async function fetchUsers() {
            if (!agent) return;

            try {
                setLoading(true);
                setError(null);

                // Get user's last 50 posts (excluding replies)
                const timeline = await agent.getAuthorFeed({
                    actor: agent.session?.handle,
                    filter: 'posts_no_replies',
                    limit: 50,
                });

                // Track engagement for each user
                const userEngagement = new Map<string, {
                    likes: number;
                    reposts: number;
                    comments: number;
                    totalScore: number;
                    myInteractions: {
                        liked: boolean;
                        reposted: boolean;
                        commented: boolean;
                    };
                }>();

                // Process each post
                for (const item of timeline.data.feed) {
                    const post = item.post;

                    // Get likes, reposts, and comments for this post
                    const [likes, thread] = await Promise.all([
                        agent.getLikes({ uri: post.uri }),
                        agent.getPostThread({ uri: post.uri, depth: 1 }),
                    ]);

                    // Process likes
                    for (const like of likes.data.likes) {
                        const userData = userEngagement.get(like.actor.did) || {
                            likes: 0,
                            reposts: 0,
                            comments: 0,
                            totalScore: 0,
                            myInteractions: {
                                liked: false,
                                reposted: false,
                                commented: false,
                            },
                        };
                        userData.likes += 1;
                        userData.totalScore += 1;
                        userEngagement.set(like.actor.did, userData);
                    }

                    // Process reposts
                    if (post.repostCount > 0) {
                        const reposts = await agent.getRepostedBy({ uri: post.uri });
                        for (const repost of reposts.data.repostedBy) {
                            const userData = userEngagement.get(repost.did) || {
                                likes: 0,
                                reposts: 0,
                                comments: 0,
                                totalScore: 0,
                                myInteractions: {
                                    liked: false,
                                    reposted: false,
                                    commented: false,
                                },
                            };
                            userData.reposts += 1;
                            userData.totalScore += 4;
                            userEngagement.set(repost.did, userData);
                        }
                    }

                    // Process comments
                    if (thread.data.thread.replies) {
                        for (const reply of thread.data.thread.replies) {
                            const userData = userEngagement.get(reply.post.author.did) || {
                                likes: 0,
                                reposts: 0,
                                comments: 0,
                                totalScore: 0,
                                myInteractions: {
                                    liked: false,
                                    reposted: false,
                                    commented: false,
                                },
                            };
                            userData.comments += 1;
                            userData.totalScore += 2;
                            userEngagement.set(reply.post.author.did, userData);
                        }
                    }
                }

                // Get highest score for percentage calculation
                const highestScore = Math.max(...Array.from(userEngagement.values()).map((u) => u.totalScore));
              
                // Fetch viewer's follows using agent.getFollows
                if (!agent.session?.did) {
                    console.error('Agent session DID is undefined.');
                    return;
                }
const viewerFollowsResponse = 
  await agent.getFollows({ actor: agent.session.did });
              
const viewerFollowsSet = new Set(viewerFollowsResponse.data.follows.map((follow) => follow.did));

                // Convert to User array with profiles and engagement scores
                const engagedUsers = await Promise.all(
                    Array.from(userEngagement.entries()).map(async ([did, engagement]) => {
                        try {
                            const profile = await agent.getProfile({ actor: did });
                            const isFollowing = viewerFollowsSet.has(did); // Check follow status

                            // Get user's last post
                            const userFeed = await agent.getAuthorFeed({
                                actor: did,
                                filter: 'posts_no_replies',
                                limit: 1,
                            });

                            // Check my interactions with their last post if it exists
                            if (userFeed.data.feed.length > 0) {
                                const lastPost = userFeed.data.feed[0].post;
                                const [postLikes, postThread] = await Promise.all([
                                    agent.getLikes({ uri: lastPost.uri }),
                                    agent.getPostThread({ uri: lastPost.uri, depth: 1 }),
                                ]);

                                engagement.myInteractions = {
                                    liked: postLikes.data.likes.some((like) => like.actor.did === agent.session?.did),
                                    reposted: false, // Add repost check if needed
                                    commented: postThread.data.thread.replies?.some(
                                        (reply) => reply.post.author.did === agent.session?.did
                                    ) || false,
                                };
                            }

                            return {
                                did,
                                handle: profile.data.handle,
                                displayName: profile.data.displayName,
                                avatar: profile.data.avatar,
                                description: profile.data.description,
                                followersCount: profile.data.followersCount,
                                followsCount: profile.data.followsCount,
                                postsCount: profile.data.postsCount,
                                engagementScore: Math.round((engagement.totalScore / highestScore) * 100),
                                interactions: {
                                    likes: engagement.likes,
                                    reposts: engagement.reposts,
                                    comments: engagement.comments,
                                    total: engagement.totalScore,
                                },
                                myInteractions: engagement.myInteractions,
                                isFollowing: isFollowing, // Assign follow status
                            } as User;
                        } catch (err) {
                            console.error(`Error processing user ${did}:`, err);
                            return null;
                        }
                    })
                );

                // Filter out nulls and sort by engagement score
                setUsers(
                    engagedUsers
                        .filter((user): user is User => user !== null)
                        .sort((a, b) => b.engagementScore - a.engagementScore)
                );
            } catch (err) {
                console.error('Error fetching user engagement:', err);
                if (mounted) setError('Failed to load user engagement data');
            } finally {
               if (mounted) setLoading(false); // Clear loading in finally block
            }
        }

        fetchUsers();
        return () => { mounted = false };
    }, [agent]);

    return { users, loading, error };
}