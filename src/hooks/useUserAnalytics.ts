import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../auth';
import { Post } from '../types/post';
import { UserSuggestedStats } from '../types/usersuggested';
import { subDays, parseISO, startOfDay } from 'date-fns';

interface UserAnalyticsData {
    activityLevels: {
        totalPosts: number;
        totalLikes: number;
        totalComments: number;
        totalShares: number;
    };
    topSuggestions: UserSuggestedStats[];
    topPosts: Post[];
    activityByHour: {
        [hour: string]: number;
    };
}

export function useUserAnalytics(userHandle: string) {
    const [data, setData] = useState<UserAnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { agent } = useAuthStore();

    const fetchAnalytics = useCallback(async () => {
        if (!agent) return;

        try {
            setLoading(true);

            // Get user's posts
            const postsResponse = await agent.getAuthorFeed({
                actor: userHandle,
                limit: 100,
            });

            const posts = postsResponse.data.feed.map(item => ({
                uri: item.post.uri,
                cid: item.post.cid,
                author: item.post.author,
                record: item.post.record,
                replyCount: item.post.replyCount || 0,
                repostCount: item.post.repostCount || 0,
                likeCount: item.post.likeCount || 0,
                indexedAt: item.post.indexedAt,
            }));

            // Calculate activity metrics
            const totalPosts = posts.length;
            const totalLikes = posts.reduce((sum, post) => sum + post.likeCount, 0);
            const totalComments = posts.reduce((sum, post) => sum + post.replyCount, 0);
            const totalShares = posts.reduce((sum, post) => sum + post.repostCount, 0);

            // Get user's followers to find similar accounts
            const followersResponse = await agent.getFollowers({
                actor: userHandle,
                limit: 5, // Default = 50
            });

            // Process similar accounts
            const suggestedUsers = new Map<string, UserSuggestedStats>();

            for (const follower of followersResponse.data.followers) {
                const followerPosts = await agent.getAuthorFeed({
                    actor: follower.handle,
                    limit: 100,
                });

                const stats = {
                    posts: { last24h: 0, last3d: 0, last7d: 0 },
                    likes: { last24h: 0, last3d: 0, last7d: 0 },
                    shares: { last24h: 0, last3d: 0, last7d: 0 },
                    comments: { last24h: 0, last3d: 0, last7d: 0 }
                };

                followerPosts.data.feed.forEach(item => {
                    const postDate = parseISO(item.post.indexedAt);
                    const now = new Date();
                    const oneDayAgo = subDays(now, 1);
                    const threeDaysAgo = subDays(now, 3);
                    const sevenDaysAgo = subDays(now, 7);

                    if (postDate >= startOfDay(oneDayAgo)) stats.posts.last24h++;
                    if (postDate >= startOfDay(threeDaysAgo)) stats.posts.last3d++;
                    if (postDate >= startOfDay(sevenDaysAgo)) stats.posts.last7d++;

                    // Add interaction counts
                    if (item.post.likeCount) {
                        if (postDate >= startOfDay(oneDayAgo)) stats.likes.last24h += item.post.likeCount;
                        if (postDate >= startOfDay(threeDaysAgo)) stats.likes.last3d += item.post.likeCount;
                        if (postDate >= startOfDay(sevenDaysAgo)) stats.likes.last7d += item.post.likeCount;
                    }
                });

                suggestedUsers.set(follower.did, {
                    did: follower.did,
                    handle: follower.handle,
                    displayName: follower.displayName,
                    avatar: follower.avatar,
                    stats
                });
            }

            // Calculate activity by hour
            const activityByHour: { [hour: string]: number } = {};
            posts.forEach(post => {
                const date = new Date(post.indexedAt);
                const hour = date.getHours().toString().padStart(2, '0');
                activityByHour[hour] = (activityByHour[hour] || 0) + 1;
            });

            setData({
                activityLevels: {
                    totalPosts,
                    totalLikes,
                    totalComments,
                    totalShares,
                },
                topSuggestions: Array.from(suggestedUsers.values())
                    .sort((a, b) => b.stats.posts.last7d - a.stats.posts.last7d)
                    .slice(0, 10),
                topPosts: posts.sort((a, b) => b.likeCount - a.likeCount).slice(0, 10),
                activityByHour,
            });
        } catch (err) {
            console.error('Error fetching user analytics:', err);
            setError('Failed to load analytics data');
        } finally {
            setLoading(false);
        }
    }, [agent, userHandle]); // Add dependencies

    useEffect(() => {
        let mounted = true;

        fetchAnalytics();

        return () => {
            mounted = false;
        };
    }, [fetchAnalytics]); // Use fetchAnalytics from useCallback

    return { data, loading, error };
}