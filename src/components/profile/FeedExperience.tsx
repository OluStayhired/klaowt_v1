import React, { useState } from 'react';
import { 
  Compass, Sparkles, PlusSquare, Trash2
} from 'lucide-react';
import { useAuthStore } from '../../auth';
import { removeInvalidFeeds } from '../../utils/preferences';

interface FeedExperienceProps {
  onFeedTypeChange: (type: 'popular' | 'suggested' | 'create') => void;
}

export function FeedExperience({ onFeedTypeChange }: FeedExperienceProps) {
  const [activeCategory, setActiveCategory] = useState<'popular' | 'suggested' | 'create'>('popular');
  const [notification, setNotification] = useState<string | null>(null);
  const { agent } = useAuthStore();

  const categories = [
    { id: 'popular', label: 'Popular Feeds', icon: Compass },
    { id: 'suggested', label: 'Suggested', icon: Sparkles },
    { id: 'create', label: 'Create Feed', icon: PlusSquare },
  ] as const;

  const handleCategoryClick = (category: typeof activeCategory) => {
    setActiveCategory(category);
    onFeedTypeChange(category);
  };

  const handleRemoveInvalidFeeds = async () => {
    if (!agent) return;

    try {
      // Get initial preferences to compare
      const initialPrefs = await agent.app.bsky.actor.getPreferences();
      const initialFeedCount = initialPrefs.data.preferences.find(
        (pref: any) => pref.$type === 'app.bsky.actor.defs#savedFeedsPrefV2'
      )?.items?.length || 0;

      // Remove invalid feeds
      await removeInvalidFeeds(agent);

      // Get updated preferences to compare
      const updatedPrefs = await agent.app.bsky.actor.getPreferences();
      const updatedFeedCount = updatedPrefs.data.preferences.find(
        (pref: any) => pref.$type === 'app.bsky.actor.defs#savedFeedsPrefV2'
      )?.items?.length || 0;

      // Calculate removed feeds
      const removedCount = initialFeedCount - updatedFeedCount;

      // Show notification
      setNotification(
        removedCount > 0
          ? `Removed ${removedCount} invalid feed${removedCount === 1 ? '' : 's'}`
          : 'No invalid feeds found'
      );

      // Clear notification after 3 seconds
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      console.error('Error removing invalid feeds:', err);
      setNotification('Failed to remove invalid feeds');
      setTimeout(() => setNotification(null), 3000);
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Feed Experience</h3>
      
      {/* Category Buttons */}
      <div className="flex flex-wrap gap-2">
        {categories.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => handleCategoryClick(id)}
            className={`inline-flex items-center px-4 py-2 rounded-full transition-colors ${
              activeCategory === id
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <Icon className={`w-4 h-4 mr-2 ${
              activeCategory === id ? 'text-white' : 'text-gray-500'
            }`} />
            <span className="text-sm font-medium">{label}</span>
          </button>
        ))}

        {/* Remove Invalid Feeds Button */}
        <button
          onClick={handleRemoveInvalidFeeds}
          className="inline-flex items-center px-4 py-2 rounded-full bg-red-100 hover:bg-red-200 text-red-700 transition-colors"
          title="Remove invalid feeds"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          <span className="text-sm font-medium">Clean Up</span>
        </button>
      </div>

      {/* Notification */}
      {notification && (
        <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">
          {notification}
        </div>
      )}
    </div>
  );
}