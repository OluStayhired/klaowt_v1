import React, { useState } from 'react';
import { Tag, Users, User2, User, Clock } from 'lucide-react';
import { FeedAlgorithm } from '../types';

interface FeedSetupFormProps {
  onSubmit: (settings: FeedAlgorithm) => void;
  initialSettings: FeedAlgorithm;
}

export function FeedSetupForm({ onSubmit, initialSettings }: FeedSetupFormProps) {
  const [name, setName] = useState(initialSettings.name || '');
  const [description, setDescription] = useState(initialSettings.description || '');
  const [authorType, setAuthorType] = useState<'anyone' | 'followers' | 'following' | 'individuals'>('anyone');
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>(initialSettings.keywords || []);
  const [currentKeyword, setCurrentKeyword] = useState('');
  const [minLikes, setMinLikes] = useState(initialSettings.interactionThresholds?.minLikes || 0);
  const [minReposts, setMinReposts] = useState(initialSettings.interactionThresholds?.minReposts || 0);
  const [timeRange, setTimeRange] = useState('24h');

  const likeThresholds = [0, 5, 10, 20, 50, 100, 200, 500, 1000];
  const repostThresholds = [0, 5, 10, 20, 50, 100, 200, 500, 1000];
  const timeRanges = [
    { value: '15m', label: '15 minutes' },
    { value: '1h', label: '1 hour' },
    { value: '24h', label: '24 hours' },
    { value: '7d', label: '7 days' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const settings: FeedAlgorithm = {
      name,
      description,
      authorFilters: authorType === 'individuals' ? selectedAuthors : [authorType],
      keywords,
      contentTypes: ['text', 'image', 'link'],
      interactionThresholds: {
        minLikes,
        minReposts,
        minReplies: 0
      },
      timeRange: {
        start: new Date(),
        end: new Date()
      }
    };

    // Set time range based on selection
    const now = new Date();
    const start = new Date(now);
    switch (timeRange) {
      case '15m':
        start.setMinutes(now.getMinutes() - 15);
        break;
      case '1h':
        start.setHours(now.getHours() - 1);
        break;
      case '24h':
        start.setHours(now.getHours() - 24);
        break;
      case '7d':
        start.setDate(now.getDate() - 7);
        break;
    }
    settings.timeRange = { start, end: now };

    onSubmit(settings);
  };

  const handleAddKeyword = () => {
    if (currentKeyword.trim() && !keywords.includes(currentKeyword.trim())) {
      setKeywords([...keywords, currentKeyword.trim()]);
      setCurrentKeyword('');
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setKeywords(keywords.filter(k => k !== keyword));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Feed Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Feed Name
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter feed name"
          required
        />
      </div>

      {/* Feed Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Feed Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Describe your feed"
          rows={3}
          required
        />
      </div>

      {/* Author Settings */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Author Settings
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => setAuthorType('anyone')}
            className={`flex items-center justify-center space-x-2 p-3 rounded-lg border ${
              authorType === 'anyone'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Anyone</span>
          </button>
          <button
            type="button"
            onClick={() => setAuthorType('followers')}
            className={`flex items-center justify-center space-x-2 p-3 rounded-lg border ${
              authorType === 'followers'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <User2 className="w-4 h-4" />
            <span>Followers</span>
          </button>
          <button
            type="button"
            onClick={() => setAuthorType('following')}
            className={`flex items-center justify-center space-x-2 p-3 rounded-lg border ${
              authorType === 'following'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Following</span>
          </button>
          <button
            type="button"
            onClick={() => setAuthorType('individuals')}
            className={`flex items-center justify-center space-x-2 p-3 rounded-lg border ${
              authorType === 'individuals'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <User2 className="w-4 h-4" />
            <span>Individuals</span>
          </button>
        </div>
      </div>

      {/* Interaction Thresholds */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Interaction Thresholds
        </label>
        
        {/* Likes Threshold */}
        <div>
          <label className="block text-sm text-gray-600 mb-2">
            Minimum Likes
          </label>
          <select
            value={minLikes}
            onChange={(e) => setMinLikes(Number(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {likeThresholds.map(threshold => (
              <option key={threshold} value={threshold}>
                {threshold === 0 ? 'No minimum' : `${threshold}+ likes`}
              </option>
            ))}
          </select>
        </div>

        {/* Reposts Threshold */}
        <div>
          <label className="block text-sm text-gray-600 mb-2">
            Minimum Reposts
          </label>
          <select
            value={minReposts}
            onChange={(e) => setMinReposts(Number(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {repostThresholds.map(threshold => (
              <option key={threshold} value={threshold}>
                {threshold === 0 ? 'No minimum' : `${threshold}+ reposts`}
              </option>
            ))}
          </select>
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
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {timeRanges.map(({ value, label }) => (
            <option key={value} value={value}>
              Last {label}
            </option>
          ))}
        </select>
      </div>

      {/* Keywords */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Keywords & Phrases
        </label>
        <div className="flex space-x-2 mb-2">
          <input
            type="text"
            value={currentKeyword}
            onChange={(e) => setCurrentKeyword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKeyword())}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Add keyword or phrase"
          />
          <button
            type="button"
            onClick={handleAddKeyword}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {keywords.map((keyword) => (
            <span
              key={keyword}
              className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700"
            >
              <Tag className="w-4 h-4 mr-1" />
              {keyword}
              <button
                type="button"
                onClick={() => handleRemoveKeyword(keyword)}
                className="ml-2 text-blue-500 hover:text-blue-700"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Proceed
        </button>
      </div>
    </form>
  );
}