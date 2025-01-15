import React, { useState, useEffect } from 'react';
import { MessageSquare, Heart, Share2, MessageCircle, Loader2 } from 'lucide-react';
import { formatNumber } from '../../utils/formatters';
import { Post } from '../../types/post';
import { subDays, parseISO } from 'date-fns';
import { useAuthStore } from '../../auth';

interface ActivityMetricsProps {
  feedUri: string;
}

type TimeRange = 'last24h' | 'last3d' | 'last7d';

interface ActivityStats {
  totalPosts: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
}

export function ActivityMetrics({ feedUri }: ActivityMetricsProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('last7d');
  const [stats, setStats] = useState<ActivityStats>({
    totalPosts: 0,
    totalLikes: 0,
    totalComments: 0,
    totalShares: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { agent } = useAuthStore();

  useEffect(() => {
    async function fetchPosts() {
      if (!agent) return;

      try {
        setLoading(true);
        setError(null);

        const now = new Date();
        const filterDate = {
          last24h: subDays(now, 1),
          last3d: subDays(now, 3),
          last7d: subDays(now, 7),
        }[timeRange];

        let allPosts: Post[] = [];
        let cursor: string | undefined;
        let hasMore = true;
        let postCount = 0;

        // Fetch posts with pagination until we get 500 posts or reach the end
        while (hasMore && postCount < 500) {
          const response = await agent.app.bsky.feed.getFeed({
            feed: feedUri,
            limit: 100,
            cursor,
          });

          if (!response?.data?.feed) {
            throw new Error('Invalid feed response');
          }

          const posts = response.data.feed
            .filter((item: any) => {
              const postDate = parseISO(item.post.indexedAt);
              return postDate >= filterDate;
            })
            .map((item: any) => ({
              uri: item.post.uri,
              cid: item.post.cid,
              author: item.post.author,
              record: item.post.record,
              replyCount: item.post.replyCount || 0,
              repostCount: item.post.repostCount || 0,
              likeCount: item.post.likeCount || 0,
              indexedAt: item.post.indexedAt,
            }));

          allPosts = [...allPosts, ...posts];
          postCount += posts.length;
          cursor = response.data.cursor;
          hasMore = !!cursor && posts.length > 0;
        }

        // Calculate metrics for the filtered posts
        const filteredPosts = allPosts.filter(post => {
          const postDate = parseISO(post.indexedAt);
          return postDate >= filterDate;
        });

        setStats({
          totalPosts: filteredPosts.length,
          totalLikes: filteredPosts.reduce((sum, post) => sum + post.likeCount, 0),
          totalComments: filteredPosts.reduce((sum, post) => sum + post.replyCount, 0),
          totalShares: filteredPosts.reduce((sum, post) => sum + post.repostCount, 0),
        });

      } catch (err) {
        console.error('Error fetching posts:', err);
        setError('Failed to load activity metrics');
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, [agent, feedUri, timeRange]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4 text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end mb-2">
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as TimeRange)}
          className="text-sm border border-gray-200 rounded-md px-2 py-1"
        >
          <option value="last24h">Last 24h</option>
          <option value="last3d">Last 3d</option>
          <option value="last7d">Last 7d</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <MessageSquare className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Posts</p>
              <p className="text-xl font-semibold">
                {formatNumber(stats.totalPosts)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Share2 className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Shares</p>
              <p className="text-xl font-semibold">
                {formatNumber(stats.totalShares)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Heart className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Likes</p>
              <p className="text-xl font-semibold">
                {formatNumber(stats.totalLikes)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <MessageCircle className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Comments</p>
              <p className="text-xl font-semibold">
                {formatNumber(stats.totalComments)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}