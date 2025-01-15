import React from 'react';
import { Feed } from '../types/feed';
import { Users, Heart, Bookmark } from 'lucide-react';

interface SavedFeedsListProps {
  feeds: Feed[];
}

export function SavedFeedsList({ feeds }: SavedFeedsListProps) {
  if (feeds.length === 0) {
    return (
      <div className="space-y-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Bookmark className="w-5 h-5" />
          Saved Feeds
        </h2>
        <p className="text-sm text-gray-500">No saved feeds yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 mb-6">
      <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <Bookmark className="w-5 h-5" />
        Saved Feeds
      </h2>
      <div className="space-y-3">
        {feeds.map((feed) => (
          <div
            key={feed.uri}
            className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start space-x-3">
              <img
                src={feed.avatar || `https://images.unsplash.com/photo-1614853316476-de00d14cb1fc?w=100&h=100&fit=crop`}
                alt={feed.displayName}
                className="w-12 h-12 rounded-lg object-cover"
              />
              <div className="flex-1">
                <h4 className="font-semibold text-sm">{feed.displayName}</h4>
                <p className="text-xs text-gray-500">
                  by {feed.creator.displayName || feed.creator.handle}
                </p>
                <p className="text-sm text-gray-600 mt-2 line-clamp-2">{feed.description}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <Users className="w-3 h-3" />
                    <span>{feed.subscriberCount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <Heart className="w-3 h-3" />
                    <span>{feed.likeCount.toLocaleString()}</span>
                  </div>
                  {feed.category && (
                    <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">
                      {feed.category}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}