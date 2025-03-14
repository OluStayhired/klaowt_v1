import React, { useState, useMemo } from 'react';
import { Feed } from '../types/feed';
import { Compass, X } from 'lucide-react';
import { ProfilePanel } from '../profile/ProfilePanel'
import { SearchBar } from './SearchBar';
import { CategoryFilter } from './CategoryFilter';
import { searchFeeds } from '../utils/search';
import { AnalyticsSidebar } from './AnalyticsSidebar';
import { useAuthStore } from '../auth';
import { FeedCard } from './feeds/FeedCard';
import { Notification } from './feeds/Notification';
import { usePinnedFeeds } from '../hooks/usePinnedFeeds';
//import { determineFeedCategory } from '../hooks/useFeeds';
import { sortFeedsWithPinned } from '../utils/feedUtils';
import { pinFeed } from '../services/feedService';

interface FeedsGridProps {
  feeds: Feed[];
  title: string;
  onFeedClick?: (feed: Feed) => void;
}

export function FeedsGrid({ feeds, title, onFeedClick }: FeedsGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedFeed, setSelectedFeed] = useState(() => {
  const followingFeed = feeds.find(feed => feed.displayName === 'Following');
  // Add new state for global search results
//const [globalSearchResults, setGlobalSearchResults] = useState<Feed[]>([]);
//const [isGlobalSearching, setIsGlobalSearching] = useState(false);
  return followingFeed || null;
});

const [globalSearchResults, setGlobalSearchResults] = useState<Feed[]>([]);
const [isGlobalSearching, setIsGlobalSearching] = useState(false);

  
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const { agent } = useAuthStore();
  const { pinnedFeeds, setPinnedFeeds } = usePinnedFeeds();

  const categories = useMemo(() => {
    const uniqueCategories = new Set(feeds.map(feed => feed.category || 'Other'));
    return Array.from(uniqueCategories).sort();
  }, [feeds]);

  const filteredFeeds = useMemo(() => {
    if (searchQuery.length >= 3) { // Check if a global search is potentially active
        if (globalSearchResults) { // Check if globalSearchResults is defined
            return globalSearchResults;
        } else {
            return []; // Return empty array if not defined yet
        }
    }
    if (!searchQuery && selectedCategory === 'All') {
        return feeds;
    }
    let filtered = feeds;

    if (searchQuery) {
        filtered = searchFeeds(filtered, searchQuery);
    }
    if (selectedCategory !== 'All') {
        filtered = filtered.filter(feed => feed.category === selectedCategory);
    }
    return filtered;
}, [feeds, searchQuery, selectedCategory, globalSearchResults]);

  const sortedFeeds = useMemo(() => {
    return sortFeedsWithPinned(filteredFeeds, pinnedFeeds);
  }, [filteredFeeds, pinnedFeeds]);

 // In FeedsGrid.tsx, update the handleSearch function

// In FeedsGrid.tsx, update the handleSearch function

const handleSearch = async (query: string) => {
  setSearchQuery(query);

  // If query is empty, reset everything
  if (!query.trim()) {
    setGlobalSearchResults([]);
    return;
  }

  // For local category filtering
  if (selectedCategory !== 'All' || !agent) {
    return; // Use existing search logic for category filtering
  }

  // Start global search if query is substantial (e.g., 2+ characters)
  if (query.length >= 2) { // Changed from 3 to 2 characters
    setIsGlobalSearching(true);
    try {
      // Search Bluesky's feed generator index
      const response = await agent.app.bsky.unspecced.getPopularFeedGenerators({
        limit: 100,
        query: query.trim()
      });

      if (!response?.data?.feeds) {
        throw new Error('Invalid response format');
      }

      // Map and filter feeds that match the query (case-insensitive)
      const globalFeeds = response.data.feeds
        .filter(feed => {
          const searchTerms = query.toLowerCase().split(/\s+/);
          const feedText = `${feed.displayName} ${feed.description || ''}`
            .toLowerCase();
          
          // Check if all search terms are present
          return searchTerms.every(term => feedText.includes(term));
        })
        .map(feed => ({
          uri: feed.uri,
          cid: feed.cid,
          creator: {
            did: feed.creator.did,
            handle: feed.creator.handle,
            displayName: feed.creator.displayName || feed.creator.handle,
            avatar: feed.creator.avatar,
          },
          displayName: feed.displayName || 'Untitled Feed',
          description: feed.description || 'No description available',
          avatar: feed.avatar,
          likeCount: feed.likeCount || 0,
          subscriberCount: feed.viewerCount || 0,
          category: determineFeedCategory(
            `${feed.displayName || ''} ${feed.description || ''}`
          ),
        }));

      setGlobalSearchResults(globalFeeds);
    } catch (err) {
      console.error('Error performing global feed search:', err);
      setGlobalSearchResults([]);
    } finally {
      setIsGlobalSearching(false);
    }
  }
};


function determineFeedCategory(text: string): string {
  const categories = {
    Technology: ['tech', 'coding', 'programming', 'developer', 'software', 'ai', 'web3', 'crypto'],
    Gaming: ['game', 'gaming', 'esports', 'twitch', 'streamer'],
    News: ['news', 'breaking', 'headlines', 'daily', 'update', 'verified'],
    Entertainment: ['entertainment', 'movies', 'music', 'tv', 'film', 'celebrity'],
    Sports: ['sports', 'football', 'basketball', 'soccer', 'nfl', 'nba', 'mlb'],
    Science: ['science', 'research', 'academic', 'space', 'physics'],
    Art: ['art', 'design', 'creative', 'photography', 'illustration'],
    Business: ['business', 'finance', 'economy', 'market', 'startup'],
    Community: ['community', 'social', 'group', 'club', 'network', 'black', 'culture'],
    Lifestyle: ['lifestyle', 'fashion', 'food', 'travel', 'health'],
  };

  const lowerText = text.toLowerCase();
  
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      return category;
    }
  }

  return 'Other';
}
  
  const handleFeedClick = (feed: Feed) => {
    setSelectedFeed(feed);
    onFeedClick?.(feed);
  };

  const handleCloseSidebar = () => {
    setSelectedFeed(null);
  };

  const handlePinFeed = async (feed: Feed, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!agent) return;

    try {
      await pinFeed(agent, feed);
      setPinnedFeeds(prev => new Set([...prev, feed.uri]));
      
      setNotification({
        message: `${feed.displayName} has been pinned to your feeds`,
        type: 'success'
      });
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      console.error('Error pinning feed:', err);
      setNotification({
        message: 'Failed to pin feed. Please try again.',
        type: 'error'
      });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  return (
    <div className="flex relative">
       {selectedFeed && (
        <div className="fixed width-450 left-384 top-0 h-screen transition-transform duration-300 transform">
          {/*<div className="fixed width-120 right-0 top-0 h-screen">*/}
          <AnalyticsSidebar
            feed={selectedFeed}
            onClose={handleCloseSidebar}
          />
        </div>
      )}      
      <div className={`bg-gradient-to-l from-white via-gray-100 to-blue-100 space-y-3 bg-gray-50/50 p-3 rounded-xl flex-1 space-y-6 transition-all ${
  selectedFeed ? 'ml-[480px]' : 'mr-[0px]'}`}>
        <SearchBar onSearch={handleSearch} />
        <div className="h-px bg-gray-200 my-4"></div>
        <div className="flex items-center justify-between space-y-0 h-1">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-1">
            <Compass className="w-6 h-6 text-blue-500" />
            {title}
          </h2>
        </div>
        <p className="flex-1 text-gray-500 text-xs mt-1 space-y-0"> Discover and Pin interesting feeds to your Bluesky timeline 📌</p>
        
        {/*<CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
      />*/}

        {notification && (
          <Notification
            message={notification.message}
            type={notification.type}
          />
        )}

        <div className={`grid ${
      selectedFeed 
    ? 'grid-cols-1 md:grid-cols-2' 
    : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
} gap-4 transition-all duration-300`}>
          {sortedFeeds.map((feed) => (
            <FeedCard
              key={feed.uri}
              feed={feed}
              isPinned={pinnedFeeds.has(feed.uri)}
              onPin={handlePinFeed}
              onClick={() => handleFeedClick(feed)}
            />
          ))}
        </div>

        {sortedFeeds.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">
              {searchQuery
                ? `No feeds found matching "${searchQuery}"`
                : 'No feeds found in this category'}
            </p>
          </div>
        )}
      </div>

      {/*Previous location for Analytics SideBar*/}
    </div>
  );
}