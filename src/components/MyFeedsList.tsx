import React from 'react';
import { Feed } from '../types/feed';
import { 
  GripVertical, Trash2, ListFilter,
  Users2, Newspaper, Compass, Radio, Palette
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface MyFeedsListProps {
  feeds: Feed[];
  onReorder: (feeds: Feed[]) => void;
  onRemove: (feed: Feed) => void;
  onFeedClick: (feed: Feed) => void;
}

// Feed-specific icons mapping
const getFeedIcon = (feedName: string) => {
  const name = feedName.toLowerCase();
  if (name.includes('following')) return Users2;
  if (name.includes('discover')) return Compass;
  if (name.includes('popular with friends')) return Radio;
  if (name.includes('verified news')) return Newspaper;
  if (name.includes('blacksky')) return Palette;
  return Users2; // Default icon
};

function SortableFeedItem({ feed, onRemove, onFeedClick }: { 
  feed: Feed; 
  onRemove: (feed: Feed) => void;
  onFeedClick: (feed: Feed) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: feed.uri });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const FeedIcon = getFeedIcon(feed.displayName);

  const handleFeedClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Feed clicked:', feed.displayName);
    onFeedClick(feed);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-all border-l-4 border-blue-500/20"
    >
      <div className="flex items-start space-x-3">
        <div {...attributes} {...listeners} className="cursor-grab mt-2 drag-handle">
          <GripVertical className="w-5 h-5 text-gray-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <FeedIcon className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h4 
                onClick={handleFeedClick}
                className="font-semibold text-sm truncate cursor-pointer hover:underline"
              >
                {feed.displayName}
              </h4>
              <p className="text-xs text-gray-500 truncate">
                by {feed.creator.displayName || feed.creator.handle}
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2 line-clamp-2">{feed.description}</p>
          <div className="flex items-center justify-end mt-2">
            {feed.uri !== 'following' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(feed);
                }}
                className="text-red-500 hover:text-red-600 p-1 rounded-full hover:bg-red-50 transition-colors remove-button"
                title="Remove feed"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function MyFeedsList({ feeds, onReorder, onRemove, onFeedClick }: MyFeedsListProps) {
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = feeds.findIndex((f) => f.uri === active.id);
      const newIndex = feeds.findIndex((f) => f.uri === over.id);
      
      const newFeeds = [...feeds];
      const [removed] = newFeeds.splice(oldIndex, 1);
      newFeeds.splice(newIndex, 0, removed);
      
      onReorder(newFeeds);
    }
  };

  return (
    <div className="space-y-4 bg-gray-50/50 p-6 rounded-xl">
      <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <ListFilter className="w-6 h-6 text-blue-500" />
        My Feeds
      </h2>
      <DndContext
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={feeds.map(feed => feed.uri)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {feeds.map((feed) => (
              <SortableFeedItem
                key={feed.uri}
                feed={feed}
                onRemove={onRemove}
                onFeedClick={onFeedClick}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      {feeds.length === 0 && (
        <p className="text-gray-500 text-sm">No feeds added yet. Discover and add feeds from the right panel.</p>
      )}
    </div>
  );
}