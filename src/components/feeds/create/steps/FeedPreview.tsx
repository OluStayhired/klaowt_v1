import React, { useState } from 'react';
import { Loader2, BarChart2, Tag, CheckCircle } from 'lucide-react';
import { FeedAlgorithm } from '../types';
import { useFeedPreview } from '../hooks/useFeedPreview';
import { PostCard } from '../../../PostCard';
import { useAuthStore } from '../../../../auth';
import confetti from 'canvas-confetti';

const debugLog = (message: string, data?: any) => {
  console.log(`[Custom Feed Creation] ${message}`, data ? JSON.stringify(data, null, 2) : '');
};

interface FeedPreviewProps {
  settings: FeedAlgorithm;
  onBack: () => void;
  onComplete: (newFeed?: any) => void;
}

export function FeedPreview({ settings, onBack, onComplete }: FeedPreviewProps) {
  const { posts, loading } = useFeedPreview(settings);
  const { user } = useAuthStore();
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!user) {
      debugLog('No user found, cannot create feed');
      return;
    }
    
    try {
      debugLog('Starting feed creation process', { settings });
      setCreating(true);

      // Generate a unique feed identifier
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 8);
      const feedId = `custom-${timestamp}-${randomString}`;

      debugLog('Generated feed ID', { feedId });

      // Create feed object with Custom category
      const newFeed = {
        uri: feedId,
        cid: feedId,
        creator: {
          did: user.did,
          handle: user.handle,
          displayName: user.displayName || user.handle,
          avatar: user.avatar,
        },
        displayName: settings.name || 'Custom Feed',
        description: settings.description || '',
        avatar: user.avatar,
        likeCount: 0,
        subscriberCount: 0,
        category: 'Custom', // Explicitly set category to Custom
        algorithm: settings
      };

      debugLog('Created new feed object', { newFeed });
      
      // Trigger confetti animation
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      debugLog('Calling onComplete with new feed');
      onComplete(newFeed);
    } catch (err) {
      debugLog('Error creating feed:', err);
      console.error('Error creating feed:', err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <BarChart2 className="w-5 h-5 text-blue-500" />
          <span>Feed Preview</span>
        </h3>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={`${post.uri}-${post.cid}`} className="relative">
                {post.keywordMatch && (
                  <div className="absolute top-2 right-2 z-10 flex items-center space-x-2">
                    <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {post.keywordMatch.percentage.toFixed(0)}% match
                    </span>
                    {post.keywordMatch.matchedWords.length > 0 && (
                      <div className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full flex items-center">
                        <Tag className="w-3 h-3 mr-1" />
                        {post.keywordMatch.matchedWords.join(', ')}
                      </div>
                    )}
                  </div>
                )}
                <PostCard
                  post={post}
                  isEngaged={false}
                  onReply={() => {}}
                  onUpdatePost={() => {}}
                />
              </div>
            ))}

            {posts.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                No posts match the current feed settings.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex space-x-4">
        <button
          onClick={onBack}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          disabled={creating}
        >
          Back
        </button>
        <button
          onClick={handleCreate}
          disabled={loading || posts.length === 0 || creating}
          className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300 transition-colors flex items-center justify-center"
        >
          {creating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating Feed...
            </>
          ) : (
            'Create Feed'
          )}
        </button>
      </div>
    </div>
  );
}