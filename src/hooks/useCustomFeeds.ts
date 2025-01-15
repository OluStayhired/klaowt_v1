import { useState, useEffect } from 'react';
import { Feed } from '../types/feed';

const CUSTOM_FEEDS_KEY = 'bluesky_custom_feeds';

const debugLog = (message: string, data?: any) => {
  console.log(`[Custom Feeds] ${message}`, data ? JSON.stringify(data, null, 2) : '');
};

export function useCustomFeeds() {
  const [customFeeds, setCustomFeeds] = useState<Feed[]>(() => {
    // Initialize from localStorage
    const savedFeeds = localStorage.getItem(CUSTOM_FEEDS_KEY);
    return savedFeeds ? JSON.parse(savedFeeds) : [];
  });

  // Save to localStorage whenever customFeeds changes
  useEffect(() => {
    debugLog('Saving custom feeds to localStorage', { feedCount: customFeeds.length });
    localStorage.setItem(CUSTOM_FEEDS_KEY, JSON.stringify(customFeeds));
  }, [customFeeds]);

  const addCustomFeed = (feed: Feed) => {
    debugLog('Adding custom feed', { feed });
    setCustomFeeds(prev => {
      // Check if feed already exists
      const exists = prev.some(f => f.uri === feed.uri);
      if (exists) return prev;
      return [feed, ...prev];
    });
  };

  const updateCustomFeed = (updatedFeed: Feed) => {
    debugLog('Updating custom feed', { 
      feedUri: updatedFeed.uri,
      algorithm: updatedFeed.algorithm 
    });
    
    setCustomFeeds(prev => {
      const newFeeds = prev.map(feed => 
        feed.uri === updatedFeed.uri ? {
          ...feed,
          ...updatedFeed,
          algorithm: {
            ...feed.algorithm,
            ...updatedFeed.algorithm
          }
        } : feed
      );
      
      debugLog('Updated feeds in state', { 
        feedCount: newFeeds.length,
        updatedFeed: newFeeds.find(f => f.uri === updatedFeed.uri)
      });
      
      return newFeeds;
    });
  };

  const removeCustomFeed = (feedUri: string) => {
    debugLog('Removing custom feed', { feedUri });
    setCustomFeeds(prev => prev.filter(feed => feed.uri !== feedUri));
  };

  return {
    customFeeds,
    addCustomFeed,
    updateCustomFeed,
    removeCustomFeed
  };
}