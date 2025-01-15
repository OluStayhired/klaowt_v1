import React from 'react';
import { FeedCard } from './FeedCard';
import { Feed } from '../types/feed';
import {
  DndContext,
  closestCenter,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

interface FeedsListProps {
  feeds: Feed[];
  onDragEnd?: (event: DragEndEvent) => void;
  isDraggable?: boolean;
  title: string;
}

export function FeedsList({ feeds, onDragEnd, isDraggable = true, title }: FeedsListProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      <DndContext
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={feeds.map(feed => feed.uri)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {feeds.map((feed) => (
              <FeedCard
                key={feed.uri}
                feed={feed}
                isDraggable={isDraggable}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}