import React from 'react';
import { MessageCircle, Activity } from 'lucide-react';

interface EngagementBarProps {
  totalPosts: number;
  engagedPosts: number;
  feedName: string;
}

export function EngagementBar({ totalPosts, engagedPosts, feedName }: EngagementBarProps) {
  const percentage = totalPosts > 0 ? (engagedPosts / totalPosts) * 100 : 0;

  return (
    <div className="bg-gradient-to-r from-white via-gray-50 to-blue-50 rounded-lg shadow-xl p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-blue-500" />
          <span className="text-sm font-medium">
            My Activity
          </span>
        </div>
        <span className="text-xs text-gray-500">
          {engagedPosts} of {totalPosts} posts
        </span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div 
          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(percentage, 100)}%` }}
          title={`${Math.round(percentage)}% engaged`}
        />
      </div>
      <p className="text-xs text-blue-500 mt-1">
        You've engaged with {Math.round(percentage)}% of posts in this feed
      </p>
    </div>
  );
}