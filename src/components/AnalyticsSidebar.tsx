import React, { useState, useEffect } from 'react';
import { X, BarChart3, MessageSquare, Settings2, Info } from 'lucide-react';
import { Feed } from '../types/feed';
import { PostsList } from './PostsList';
import { InsightsPanel } from './analytics/InsightsPanel';
import { FeedSettings } from './settings/FeedSettings';

interface AnalyticsSidebarProps {
  feed: Feed;
  onClose: () => void;
}

export function AnalyticsSidebar({ feed, onClose }: AnalyticsSidebarProps) {
  const [activeTab, setActiveTab] = useState<'posts' | 'insights' | 'settings'>('posts');
  const [showTooltip, setShowTooltip] = useState(false); // State for tooltip visibility
  const [showInsightTooltip, setShowInsightTooltip] = useState(false); // State for tooltip visibility

  // Reset to Posts tab when feed changes
  useEffect(() => {
    setActiveTab('posts');
  }, [feed.uri]);

  // Determine which tabs to show based on feed category
  const showInsightsTab = feed.category !== 'Custom';
  const showSettingsTab = feed.category === 'Custom';

  return (
    <div className="w-96 bg-white border-l border-gray-200 h-screen overflow-hidden flex flex-col">
      {/* Fixed Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 pt-[72px]">
        <div className="relative px-4 py-4">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>

          <div className="flex items-center space-x-3">
            <img
              src={feed.avatar || 'https://images.unsplash.com/photo-1614853316476-de00d14cb1fc?w=100&h=100&fit=crop'}
              alt={feed.displayName}
              className="w-10 h-10 rounded-lg object-cover"
            />
            <div>
              <h3 className="font-semibold text-gray-900">{feed.displayName}</h3>
              <p className="text-sm text-gray-500">by {feed.creator.displayName || feed.creator.handle}</p>
            </div>
          </div>
        </div>

        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex-1 px-4 py-3 text-sm font-medium ${
              activeTab === 'posts'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <MessageSquare className="w-4 h-4" />
              <span className="flex items-left">
                Posts 
                 <span className="flex items-center cursor-pointer hover:text-gray-500"
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                >
                <Info className="w-3 h-3 text-gray-400 ml-1"/> 
                {showTooltip && ( // Tooltip content displayed conditionally
                <div className="flex-1 items-left justify-left absolute ml-5 bg-gray-800 w-half text-xs text-white px-2 py-1 rounded-md shadow-sm max-w-48 max-h-24 z-10 mb-10">follow, like & comment directly on posts in this feed↗️ 
                </div>
                )}
                  </span>

              </span>
            </div>
          </button>
          
          {showInsightsTab && (
            <button
              onClick={() => setActiveTab('insights')}
              className={`flex-1 px-4 py-3 text-sm font-medium ${
                activeTab === 'insights'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <BarChart3 className="w-4 h-4" />
                <span className="flex items-left">
                  Insights        
                  
                  {/*<span className="relative flex items-left cursor-pointer hover:text-gray-500"
                    onMouseEnter={() => setShowInsightTooltip(true)}
                    onMouseLeave={() => setShowInsightTooltip(false)}
                >
                     
                <Info className="w-3 h-3 text-gray-400 ml-1"/> 
                {showInsightTooltip && ( // Tooltip content displayed conditionally
                <div className="absolute left-[-10px] bottom-full mb-1 bg-gray-800 text-xs text-white px-2 py-1 rounded-md shadow-sm max-w-48 max-h-24 z-10">reply to banger posts🔥 
                </div>
                )}
                  </span>*/}
                
                
                </span>
              </div>
            </button>
          )}

          {showSettingsTab && (
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 px-4 py-3 text-sm font-medium ${
                activeTab === 'settings'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Settings2 className="w-4 h-4" />
                <span>Settings</span>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          {activeTab === 'posts' && (
            <PostsList 
              feedUri={feed.uri} 
              feedName={feed.displayName}
              feedCategory={feed.category}
            />
          )}
          {activeTab === 'insights' && showInsightsTab && (
            <InsightsPanel 
              feedUri={feed.uri}
              feedName={feed.displayName}
              feedDescription={feed.description}
              feedAvatar={feed.avatar}
              feedCreator={feed.creator}
            />
          )}
          {activeTab === 'settings' && showSettingsTab && (
            <FeedSettings
              feed={feed}
            />
          )}
        </div>
      </div>
    </div>
  );
}