import React from 'react';
import { Heart, Pin, PlusCircle } from 'lucide-react';
import { Feed } from '../../types/feed';

interface FeedCardProps {
  feed: Feed;
  isPinned: boolean;
  onPin: (feed: Feed, e: React.MouseEvent) => void;
  onClick: () => void;
}

export function FeedCard({ feed, isPinned, onPin, onClick }: FeedCardProps) {
  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-all transform hover:-translate-y-0.5 relative cursor-pointer"
    >
      <div className="flex items-start space-x-3">
        <img
          src={feed.avatar || `https://images.unsplash.com/photo-1614853316476-de00d14cb1fc?w=100&h=100&fit=crop`}
          alt={feed.displayName}
          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm mb-1 truncate" title={feed.displayName}>
            {feed.displayName}
          </h4>
          <p className="text-gray-600 text-xs line-clamp-2 mb-2" title={feed.description}>
            {feed.description}
          </p>
          <div className="flex items-center text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <Heart className="w-3 h-3" />
              <span>{feed.likeCount.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-2 text-xs text-gray-500 truncate">
        by {feed.creator.displayName || feed.creator.handle}
      </div>
      {feed.uri === 'following' ? (
        <div 
          className="absolute top-2 right-2 p-1.5 text-gray-400"
          title="Following feed"
        >
          <Pin className="w-4 h-4" />
        </div>
      ) : isPinned ? (
        <div 
          className="absolute top-2 right-2 p-1.5 text-gray-400"
          title="Pinned feed"
        >
          <Pin className="w-4 h-4" />
        </div>
      ) : (
        <button
          onClick={(e) => onPin(feed, e)}
          className="absolute top-2 right-2 p-1.5 bg-blue-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-600"
          title="Pin feed"
        >
          <PlusCircle className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}