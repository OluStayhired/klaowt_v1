import React, { useState, useEffect } from 'react';
import { Clock, Tag, Heart, Share2, Edit2, Check, Percent } from 'lucide-react';
import { FeedAlgorithm } from '../../components/feeds/create/types';
import { Feed } from '../../types/feed';
import { useCustomFeeds } from '../../hooks/useCustomFeeds';

interface FeedSettingsProps {
  feed: Feed;
}

export function FeedSettings({ feed }: FeedSettingsProps) {
  const { updateCustomFeed } = useCustomFeeds();
  const [isEditing, setIsEditing] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [settings, setSettings] = useState<FeedAlgorithm>(() => {
    // Get the current feed settings from localStorage
    const customFeeds = JSON.parse(localStorage.getItem('bluesky_custom_feeds') || '[]');
    const currentFeed = customFeeds.find((f: Feed) => f.uri === feed.uri);
    
    // Initialize with default settings
    const defaultSettings = {
      keywords: [],
      timeRange: {
        start: new Date(),
        end: new Date()
      },
      interactionThresholds: {
        minLikes: 0,
        minReposts: 0
      },
      keywordMatchThreshold: 5 // Default to 5%
    };

    // If feed has algorithm settings, parse dates properly and ensure keywordMatchThreshold
    if (currentFeed?.algorithm) {
      return {
        ...currentFeed.algorithm,
        timeRange: {
          start: new Date(currentFeed.algorithm.timeRange?.start || new Date()),
          end: new Date(currentFeed.algorithm.timeRange?.end || new Date())
        },
        keywordMatchThreshold: currentFeed.algorithm.keywordMatchThreshold || 5
      };
    }

    return defaultSettings;
  });

  const [currentKeyword, setCurrentKeyword] = useState('');

  // Update settings when feed changes
  useEffect(() => {
    const customFeeds = JSON.parse(localStorage.getItem('bluesky_custom_feeds') || '[]');
    const currentFeed = customFeeds.find((f: Feed) => f.uri === feed.uri);
    
    if (currentFeed?.algorithm) {
      setSettings({
        ...currentFeed.algorithm,
        timeRange: {
          start: new Date(currentFeed.algorithm.timeRange?.start || new Date()),
          end: new Date(currentFeed.algorithm.timeRange?.end || new Date())
        },
        keywordMatchThreshold: currentFeed.algorithm.keywordMatchThreshold || 5
      });
    }
  }, [feed.uri]);

  const handleAddKeyword = () => {
    if (currentKeyword.trim() && !settings.keywords?.includes(currentKeyword.trim())) {
      setSettings({
        ...settings,
        keywords: [...(settings.keywords || []), currentKeyword.trim()]
      });
      setCurrentKeyword('');
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setSettings({
      ...settings,
      keywords: settings.keywords?.filter(k => k !== keyword) || []
    });
  };

  const handleSave = () => {
    const updatedFeed = {
      ...feed,
      algorithm: {
        ...settings,
        keywordMatchThreshold: settings.keywordMatchThreshold || 5 // Ensure threshold is saved
      }
    };
    updateCustomFeed(updatedFeed);
    setIsEditing(false);
    setNotification('Feed settings updated successfully');
    setTimeout(() => setNotification(null), 3000);
  };

  // Rest of the component remains unchanged...
  // (Keep all the JSX and other functions exactly as they were)

  return (
    <div className="space-y-6">
      {notification && (
        <div className="bg-blue-50 text-blue-700 p-3 rounded-lg text-sm">
          {notification}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Feed Settings</h3>
          <button
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
          >
            {isEditing ? (
              <>
                <Check className="w-4 h-4" />
                <span>Save</span>
              </>
            ) : (
              <>
                <Edit2 className="w-4 h-4" />
                <span>Edit</span>
              </>
            )}
          </button>
        </div>

        {isEditing ? (
          <div className="space-y-6">
            {/* Keywords */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center space-x-2">
                  <Tag className="w-4 h-4 text-gray-500" />
                  <span>Keywords & Phrases</span>
                </div>
              </label>
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={currentKeyword}
                  onChange={(e) => setCurrentKeyword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKeyword())}
                  className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add keyword or phrase"
                />
                <button
                  onClick={handleAddKeyword}
                  className="px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {settings.keywords?.map((keyword) => (
                  <span
                    key={keyword}
                    className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700"
                  >
                    <Tag className="w-4 h-4 mr-1" />
                    {keyword}
                    <button
                      onClick={() => handleRemoveKeyword(keyword)}
                      className="ml-2 text-blue-500 hover:text-blue-700"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Time Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span>Time Range</span>
                </div>
              </label>
              <select
                value={settings.timeRange?.end.getTime() - settings.timeRange?.start.getTime()}
                onChange={(e) => {
                  const now = new Date();
                  const start = new Date();
                  start.setTime(now.getTime() - parseInt(e.target.value));
                  setSettings({
                    ...settings,
                    timeRange: { start, end: now }
                  });
                }}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={15 * 60 * 1000}>Last 15 minutes</option>
                <option value={60 * 60 * 1000}>Last hour</option>
                <option value={24 * 60 * 60 * 1000}>Last 24 hours</option>
                <option value={7 * 24 * 60 * 60 * 1000}>Last 7 days</option>
              </select>
            </div>

            {/* Interaction Thresholds */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Interaction Thresholds
              </label>
              
              {/* Minimum Likes */}
              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  <div className="flex items-center space-x-2">
                    <Heart className="w-4 h-4 text-gray-500" />
                    <span>Minimum Likes</span>
                  </div>
                </label>
                <select
                  value={settings.interactionThresholds?.minLikes || 0}
                  onChange={(e) => setSettings({
                    ...settings,
                    interactionThresholds: {
                      ...settings.interactionThresholds,
                      minLikes: parseInt(e.target.value)
                    }
                  })}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {[0, 5, 10, 20, 50, 100, 200, 500, 1000].map(value => (
                    <option key={value} value={value}>
                      {value === 0 ? 'No minimum' : `${value}+ likes`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Minimum Reposts */}
              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  <div className="flex items-center space-x-2">
                    <Share2 className="w-4 h-4 text-gray-500" />
                    <span>Minimum Reposts</span>
                  </div>
                </label>
                <select
                  value={settings.interactionThresholds?.minReposts || 0}
                  onChange={(e) => setSettings({
                    ...settings,
                    interactionThresholds: {
                      ...settings.interactionThresholds,
                      minReposts: parseInt(e.target.value)
                    }
                  })}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {[0, 5, 10, 20, 50, 100, 200, 500, 1000].map(value => (
                    <option key={value} value={value}>
                      {value === 0 ? 'No minimum' : `${value}+ reposts`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Keyword Match Threshold */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                <div className="flex items-center space-x-2">
                  <Percent className="w-4 h-4 text-gray-500" />
                  <span>Keyword Match Threshold</span>
                </div>
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={settings.keywordMatchThreshold || 5}
                  onChange={(e) => setSettings({
                    ...settings,
                    keywordMatchThreshold: parseInt(e.target.value)
                  })}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-sm font-medium text-gray-900 w-16">
                  {settings.keywordMatchThreshold || 5}%
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Posts must match at least this percentage of keywords to be included
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Display Keywords */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center space-x-2">
                  <Tag className="w-4 h-4 text-gray-500" />
                  <span>Keywords & Phrases</span>
                </div>
              </label>
              <div className="flex flex-wrap gap-2">
                {settings.keywords?.map((keyword) => (
                  <span
                    key={keyword}
                    className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700"
                  >
                    <Tag className="w-4 h-4 mr-1" />
                    {keyword}
                  </span>
                ))}
              </div>
            </div>

            {/* Display Time Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span>Time Range</span>
                </div>
              </label>
              <p className="text-sm text-gray-600">
                Last {
                  settings.timeRange?.end.getTime() - settings.timeRange?.start.getTime() <= 15 * 60 * 1000
                    ? '15 minutes'
                    : settings.timeRange?.end.getTime() - settings.timeRange?.start.getTime() <= 60 * 60 * 1000
                    ? 'hour'
                    : settings.timeRange?.end.getTime() - settings.timeRange?.start.getTime() <= 24 * 60 * 60 * 1000
                    ? '24 hours'
                    : '7 days'
                }
              </p>
            </div>

            {/* Display Interaction Thresholds */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Interaction Thresholds
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <Heart className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Minimum Likes</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {settings.interactionThresholds?.minLikes === 0
                      ? 'No minimum'
                      : `${settings.interactionThresholds?.minLikes}+ likes`}
                  </p>
                </div>
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <Share2 className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Minimum Reposts</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {settings.interactionThresholds?.minReposts === 0
                      ? 'No minimum'
                      : `${settings.interactionThresholds?.minReposts}+ reposts`}
                  </p>
                </div>
              </div>
            </div>

            {/* Display Keyword Match Threshold */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center space-x-2">
                  <Percent className="w-4 h-4 text-gray-500" />
                  <span>Keyword Match Threshold</span>
                </div>
              </label>
              <p className="text-sm text-gray-600">
                Posts must match at least {settings.keywordMatchThreshold || 5}% of keywords
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}