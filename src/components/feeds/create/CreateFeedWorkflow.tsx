import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { FeedSetupForm } from './steps/FeedSetupForm';
import { FeedValidation } from './steps/FeedValidation';
import { FeedPreview } from './steps/FeedPreview';
import { FeedAlgorithm } from './types';
import { Feed } from '../../../types/feed';
import { useAuthStore } from '../../../auth';

interface CreateFeedWorkflowProps {
  onBack: (newFeed?: Feed) => void;
}

export function CreateFeedWorkflow({ onBack }: CreateFeedWorkflowProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [feedSettings, setFeedSettings] = useState<FeedAlgorithm>({
    keywords: [],
    contentTypes: ['text', 'image', 'link'],
    interactionThresholds: {
      minLikes: 0,
      minReposts: 0,
      minReplies: 0
    }
  });
  const [isValidated, setIsValidated] = useState(false);
  const { user } = useAuthStore();

  const handleSettingsSubmit = (settings: FeedAlgorithm) => {
    setFeedSettings(settings);
    setCurrentStep(2);
  };

  const handleValidationComplete = () => {
    setIsValidated(true);
    setCurrentStep(3);
  };

  const handleCreateFeed = () => {
    if (!user) return;

    // Generate a unique feed identifier using timestamp and random string
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const feedId = `feed-${timestamp}-${randomString}`;

    // Create properly formatted AT URI for the feed
    // Format: at://did:plc:xyz/app.bsky.feed.generator/feedname
    const feedUri = `at://${user.did}/app.bsky.feed.generator/${feedId}`;

    // Create new feed object with Custom category
    const newFeed: Feed = {
      uri: feedUri,
      cid: feedId,
      creator: {
        did: user.did,
        handle: user.handle,
        displayName: user.displayName || user.handle,
        avatar: user.avatar,
      },
      displayName: feedSettings.name || 'Custom Feed',
      description: feedSettings.description || '',
      avatar: user.avatar,
      likeCount: 0,
      subscriberCount: 0,
      category: 'Custom', // Explicitly set category to Custom
      algorithm: feedSettings
    };

    // Pass the new feed back to parent
    onBack(newFeed);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => onBack()}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </button>
        <h2 className="text-xl font-bold text-gray-900">Create Custom Feed</h2>
      </div>

      {/* Steps */}
      <div className="space-y-8">
        {currentStep === 1 && (
          <FeedSetupForm 
            onSubmit={handleSettingsSubmit}
            initialSettings={feedSettings}
          />
        )}

        {currentStep === 2 && (
          <FeedValidation
            settings={feedSettings}
            onBack={() => setCurrentStep(1)}
            onComplete={handleValidationComplete}
          />
        )}

        {currentStep === 3 && (
          <FeedPreview
            settings={feedSettings}
            onBack={() => setCurrentStep(2)}
            onComplete={handleCreateFeed}
          />
        )}
      </div>
    </div>
  );
}