import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../auth';
import { 
  MessageSquare, Heart, Share2, Users, 
  User, Calendar, Link, Info, Loader2
} from 'lucide-react';
import { formatNumber } from '../../utils/formatters';
import { format, isValid, parseISO } from 'date-fns';

interface ActivityOverviewProps {
  feedUri: string;
}

interface FeedGeneratorView {
  uri: string;
  cid: string;
  did: string;
  creator: {
    did: string;
    handle: string;
    displayName?: string;
    avatar?: string;
  };
  displayName: string;
  description?: string;
  descriptionHtml?: string;
  avatar?: string;
  likeCount: number;
  viewer: {
    like?: string;
    viewerState?: {
      count?: number;
    };
  };
  indexedAt: string;
  createdAt: string;
}

export function ActivityOverview({ feedUri }: ActivityOverviewProps) {
  const [feedData, setFeedData] = useState<FeedGeneratorView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { agent } = useAuthStore();

  // Helper function to safely format dates
  const formatDate = (dateString: string | undefined | null, formatString: string): string => {
    if (!dateString) return 'N/A';
    
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) {
        return 'N/A';
      }
      return format(date, formatString);
    } catch (err) {
      console.error('Error formatting date:', err);
      return 'N/A';
    }
  };

  useEffect(() => {
    async function fetchFeedData() {
      if (!agent || !feedUri) {
        setError('Missing required data');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await agent.app.bsky.feed.getFeedGenerator({
          feed: feedUri,
        });

        if (!response?.data) {
          throw new Error('Invalid response data');
        }

        setFeedData(response.data);
      } catch (err) {
        console.error('Error fetching feed data:', err);
        setError('Failed to load feed data');
      } finally {
        setLoading(false);
      }
    }

    fetchFeedData();
  }, [agent, feedUri]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error || !feedData) {
    return (
      <div className="text-center py-4 text-gray-500">
        {error || 'No feed data available'}
      </div>
    );
  }

  const creatorName = feedData.creator?.displayName || feedData.creator?.handle || 'Unknown Creator';
  const creatorAvatar = feedData.creator?.avatar || 'https://images.unsplash.com/photo-1614853316476-de00d14cb1fc?w=100&h=100&fit=crop';
  const subscriberCount = feedData.viewer?.viewerState?.count || 0;
  const likeCount = feedData.likeCount || 0;

  return (
    <div className="space-y-6">
      {/* Feed Creator Info */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6">
          <div className="flex items-start space-x-4">
            <img
              src={creatorAvatar}
              alt={creatorName}
              className="w-16 h-16 rounded-lg object-cover"
            />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {feedData.displayName}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Created by {creatorName}
              </p>
              {feedData.description && (
                <p className="text-sm text-gray-600 mt-2">
                  {feedData.description}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 bg-gray-50">
          <div className="grid grid-cols-2 divide-x divide-gray-100">
            <div className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Created</span>
              </div>
              <p className="text-sm font-medium mt-1">
                {formatDate(feedData.createdAt, 'MMM d, yyyy')}
              </p>
            </div>
            <div className="p-4">
              <div className="flex items-center space-x-2">
                <Link className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Feed URI</span>
              </div>
              <p className="text-sm font-medium mt-1 truncate">
                {feedData.uri}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Feed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-purple-50 to-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-purple-600">Total Subscribers</p>
            <p className="text-3xl font-bold text-purple-900 mt-1">
              {formatNumber(subscriberCount)}
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-red-100 rounded-lg">
              <Heart className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-red-600">Total Likes</p>
            <p className="text-3xl font-bold text-red-900 mt-1">
              {formatNumber(likeCount)}
            </p>
          </div>
        </div>
      </div>

      {/* Feed Metadata */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Info className="w-5 h-5 text-gray-400" />
          <h4 className="text-sm font-medium text-gray-700">Feed Metadata</h4>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">DID</span>
            <span className="font-medium text-gray-900">{feedData.did}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">CID</span>
            <span className="font-medium text-gray-900">{feedData.cid}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Indexed At</span>
            <span className="font-medium text-gray-900">
              {formatDate(feedData.indexedAt, 'MMM d, yyyy HH:mm:ss')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}