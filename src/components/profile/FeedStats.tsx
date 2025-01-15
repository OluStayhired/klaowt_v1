import React from 'react';
import { ArrowUp } from 'lucide-react';

export function FeedStats() {
  const topFeeds = [
    { name: 'Tech News', engagement: 85 },
    { name: 'Developer Updates', engagement: 72 },
    { name: 'Crypto Insights', engagement: 64 },
  ];

  const getGradientClass = (engagement: number) => {
    if (engagement >= 80) {
      return 'from-blue-400 via-blue-500 to-blue-600';
    }
    if (engagement >= 70) {
      return 'from-indigo-400 via-indigo-500 to-indigo-600';
    }
    return 'from-violet-400 via-violet-500 to-violet-600';
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Engaged Feeds</h3>
      <div className="space-y-5">
        {topFeeds.map((feed, index) => (
          <div key={feed.name} className="relative">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-semibold text-gray-700">{feed.name}</span>
                <ArrowUp className="w-4 h-4 text-green-500" />
              </div>
              <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${getGradientClass(feed.engagement)} text-white text-xs font-medium shadow-sm`}>
                {feed.engagement}%
              </div>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r ${getGradientClass(feed.engagement)} transition-all duration-500`}
                style={{ width: `${feed.engagement}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}