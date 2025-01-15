import React from 'react';
import { Users, Heart } from 'lucide-react';
import { Feed } from '../types/feed';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface FeedCardProps {
  feed: Feed;
  isDraggable?: boolean;
}

export function FeedCard({ feed, isDraggable = true }: FeedCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: feed.uri,
    disabled: !isDraggable,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start space-x-4">
        <img
          src={feed.avatar || 'https://images.unsplash.com/photo-1614853316476-de00d14cb1fc?w=100&h=100&fit=crop'}
          alt={feed.displayName}
          className="w-16 h-16 rounded-lg object-cover"
        />
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{feed.displayName}</h3>
          <p className="text-gray-600 text-sm mt-1">{feed.description}</p>
          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4" />
              <span>{feed.subscriberCount}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Heart className="w-4 h-4" />
              <span>{feed.likeCount}</span>
            </div>
            {feed.category && (
              <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                {feed.category}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}