
// Update the onClick handler in UsersGrid.tsx to show the UserAnalyticsSidebar
import React, { useState, useEffect } from 'react';
import { Users, AlertCircle, CheckCircle2, UserPlus, UsersRound, UserCheck, Handshake, ArrowUpDown, Filter, Repeat, RefreshCw, Clock, X, Lightbulb, Heart } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { User } from '../types/user';
import { UserCard } from './users/UserCard';
import { UsersSearchBar } from './users/UsersSearchBar';
import { useAuthStore } from '../auth';
import { usePinnedUsers } from '../hooks/usePinnedUsers';
import { useUsers } from '../hooks/useUsers';
import { useDebounce } from '../hooks/useDebounce';
import { UserAnalyticsSidebar } from './UserAnalyticsSidebar';
//import { LoadingSpinner } from 'lucide-react';

import { useActivityHours } from '../hooks/useActivityHours';
import { Info, ChevronDown } from 'lucide-react';


interface UsersGridProps {
  users: User[];
  title: string;
  onUserClick?: (user: User) => void;
  loading?: boolean; // Add this if needed
}

interface ActivityHourData {
  hour: number;
  count: number;
  percentage: number;
}

interface ActivityStats {
  topHours: ActivityHourData[];
  totalInteractions: number;
}


type SortOption = 'engagement' | 'followers' | 'following' | 'recent';
type InteractionFilter = 'all' | 'unengaged' | 'engaged' | 'high-engagement';

export function UsersGrid({ users, title, onUserClick }: UsersGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Following' | 'Followers' | 'Mutuals'>('All');
  const [sortBy, setSortBy] = useState<SortOption>('engagement');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [interactionFilter, setInteractionFilter] = useState<InteractionFilter>('all');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const { agent,user } = useAuthStore();
  const { pinnedUsers, setPinnedUsers } = usePinnedUsers();
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
// Add state for selected user
const [selectedUser, setSelectedUser] = useState<User | null>(null);
//const { loading: usersLoading, error } = useUsers();
const { users: hookUsers, loading: usersLoading, error } = useUsers();    
const [hoveredIndex, setHoveredIndex] = useState(null);
const [localUsers, setLocalUsers] = useState<User[]>(users); //for local updates
const [loading, setLoading] = useState(false);
const [showActivityHours, setShowActivityHours] = useState(false);  
const [activityLoading, setActivityLoading] = useState(false);
const [activityError, setActivityError] = useState<string | null>(null);
const [isLegendExpanded, setIsLegendExpanded] = useState(false);
const [isGatheringData, setIsGatheringData] = useState(true);
  
  
//const { activityStats } = useActivityHours();
//const { activityStats, loading: activityLoading, error: activityError } = useActivityHours();

// Separate state declarations for each piece of data
const [activityStats, setActivityStats] = useState<{
  topHours: Array<{
    hour: number;
    minutes: number;
    count: number;
    percentage: number;
  }>;
  totalInteractions: number;
}>({
  topHours: [],
  totalInteractions: 0
});  

useEffect(() => {
  if (usersLoading) {
    // Show gathering data message first
    setIsGatheringData(true);
    
    // After 3 seconds, switch to loading interactions message
    const timer = setTimeout(() => {
      setIsGatheringData(false);
    }, 3000);

    return () => clearTimeout(timer);
  } else {
    setIsGatheringData(false);
  }
}, [usersLoading]);

  
  useEffect(() => {
  console.log('Selected user changed:', selectedUser);
}, [selectedUser]);

//useEffect Added for local updates  
useEffect(() => {
        setLocalUsers(users);
    }, [users]);
  
useEffect(() => {
  if (selectedUser) {
    // Add a class to show the transition
    document.body.classList.add('sidebar-open');
  } else {
    document.body.classList.remove('sidebar-open');
  }
}, [selectedUser]);  

useEffect(() => {
  console.log('Selected user changed:', {
    isSelected: !!selectedUser,
    user: selectedUser,
    timestamp: new Date().toISOString()
  });
}, [selectedUser]);  

useEffect(() => {
  if (selectedUser) {
    const sidebar = document.querySelector('[data-testid="user-analytics-sidebar"]');
    console.log('Sidebar element present:', !!sidebar);
    console.log('Sidebar dimensions:', sidebar?.getBoundingClientRect());
  }
}, [selectedUser]);  

{/*Start Activity Hours*/}    
//if (loading) return (
//  <div className="flex justify-center items-center py-8">
//    <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
//  </div>
//);

// Format hours in 12-hour format with am/pm
  {/*const formatHour = (hour: number) => {
  const ampm = hour >= 12 ? 'pm' : 'am';
  const h = hour % 12 || 12;
  return `${h}${ampm}`;
};  */}

const formatHour = (hour: number, minutes: number = 0) => {
  const ampm = hour >= 12 ? 'pm' : 'am';
  const h = hour % 12 || 12;
  return `${h}:${minutes.toString().padStart(2, '0')}${ampm}`;
};
  

const roundToNearest30Minutes = (hour: number) => {
  // Convert hour to minutes
  const totalMinutes = hour * 60;
  // Round down to nearest 30
  //const roundedMinutes = Math.floor(totalMinutes / 30) * 30;
  const roundedMinutes = Math.floor(totalMinutes / 10) * 10;  
  // Convert back to decimal hours
  //return roundedMinutes / 60;
  return parseFloat((roundedMinutes / 60).toFixed(2)); // Round to 2 decimal places  
};



const handlePeakHours = async () => {
  if (!agent || !user) return;

  try {
    //setLoading(true);
    setActivityLoading(true);
    
    // Initialize activity tracking
    const hourlyActivity = new Map<number, number>();
    for (let i = 0; i < 24; i++) {
      hourlyActivity.set(i, 0);
    }

    // Get user's timeline with batching
    const timeline = await agent.getAuthorFeed({
      actor: user.handle,
      limit: 100
    });

    // Process posts in batches of 10 for better performance
    const batchSize = 20;
    const posts = timeline.data.feed;
    
    for (let i = 0; i < posts.length; i += batchSize) {
      const batch = posts.slice(i, i + batchSize);
      
      // Process batch in parallel
      await Promise.all(batch.map(async (item) => {
        const post = item.post;
        
        // Get interactions in parallel
        const [likes, thread] = await Promise.all([
          agent.getLikes({ uri: post.uri }),
          agent.getPostThread({ uri: post.uri, depth: 1 })
        ]);

        // Process likes
        likes.data.likes.forEach(like => {
          const hour = new Date(like.createdAt).getHours();
          hourlyActivity.set(hour, (hourlyActivity.get(hour) || 0) + 1);
        });

        // Process comments
        thread.data.thread.replies?.forEach(reply => {
          const hour = new Date(reply.post.indexedAt).getHours();
          hourlyActivity.set(hour, (hourlyActivity.get(hour) || 0) + 1);
        });
      }));
    }

    // Calculate total interactions
    const totalInteractions = Array.from(hourlyActivity.values())
      .reduce((sum, count) => sum + count, 0);

    // Get top 3 hours sorted by activity
    {/*const sortedHours = Array.from(hourlyActivity.entries())
      .map(([hour, count]) => ({
        hour,
        count,
        percentage: (count / totalInteractions) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);*/}

    // Inside handlePeakHours function:
const sortedHours = Array.from(hourlyActivity.entries())
  .map(([hour, count]) => {
    // Round the hour down to nearest 30 minutes
    const roundedHour = roundToNearest30Minutes(hour);
    
    // Split into hour and minutes
    const wholeHour = Math.floor(roundedHour);
    const minutes = Math.round((roundedHour - wholeHour) * 60);
    
    return {
      hour: wholeHour,
      minutes: minutes,
      count,
      percentage: (count / totalInteractions) * 100
    };
  })
  .sort((a, b) => b.count - a.count)
  .slice(0, 3);


    // Update state
    setActivityStats({
      topHours: sortedHours,
      totalInteractions
    });
    setShowActivityHours(true);

    // Show success notification
    setNotification({
      message: 'Peak hours data loaded successfully',
      type: 'success'
    });

  } catch (err) {
    console.error('Error loading peak hours:', err);
    setNotification({
      message: 'Failed to load peak hours data',
      type: 'error'
    });
  } finally {
    setActivityLoading(false);
  }
};

  

  {/*End Activity Hours*/}  
  
// start handleInteractions update (for local updates)
const handleInteractionUpdate = (userDid: string, updates: {
        liked: boolean;
        commented: boolean;
        reposted: boolean;
    }) => {
        setLocalUsers(prevUsers =>
            prevUsers.map(user => {
                if (user.did === userDid) {
                    return {
                        ...user,
                        myInteractions: {
                            ...user.myInteractions,
                            liked: updates.liked,
                            commented: updates.commented,
                            reposted: updates.reposted
                        },
                        interactions: {
                            ...user.interactions,
                            likes: updates.liked ? user.interactions.likes + (updates.liked ? 1 : -1) : user.interactions.likes,
                            comments: updates.commented ? user.interactions.comments + (updates.commented ? 1 : -1) : user.interactions.comments,
                            reposts: updates.reposted ? user.interactions.reposts + (updates.reposted ? 1 : -1) : user.interactions.reposts,
                        }
                    };
                }
                return user;
            })
        );
    };
// end handleInteractions update  (for local updates)
  
  
 const categories = [
    { id: 'All', label: 'Top Friends', icon: Heart },
    //{ id: 'Following', label: 'Following', icon: UserCheck },
    //{ id: 'Followers', label: 'Followers', icon: UserPlus },
    //{ id: 'Mutuals', label: 'Mutuals', icon: Handshake },
  ];

  const sortOptions = [
    { value: 'engagement', label: 'Engagement Score' },
    { value: 'followers', label: 'Followers Count' },
    { value: 'following', label: 'Following Count' },
    { value: 'recent', label: 'Recent Activity' },
  ];

  const interactionOptions = [
    { value: 'all', label: 'All Interactions' },
    { value: 'unengaged', label: 'Not Engaged' },
    { value: 'engaged', label: 'Engaged' },
    { value: 'high-engagement', label: 'High Engagement' },
  ];

  {/*Version of filteredAndSortedUsers to allow optimistic updates*/}
  const filteredAndSortedUsers = React.useMemo(() => {
    return localUsers // Use localUsers here
        .filter(user => {
            // Category filter
            if (selectedCategory !== 'All') {
                if (!user.category?.includes(selectedCategory)) return false;
            }

            // Search filter
            if (debouncedSearchQuery) {
                const searchText = `${user.displayName || ''} ${user.handle} ${user.description || ''}`.toLowerCase();
                if (!debouncedSearchQuery.toLowerCase().split(' ').every(term => searchText.includes(term))) {
                    return false;
                }
            }

            // Interaction filter
            switch (interactionFilter) {
                case 'unengaged':
                    return !user.myInteractions.liked && !user.myInteractions.commented && !user.myInteractions.reposted;
                case 'engaged':
                    return user.myInteractions.liked || user.myInteractions.commented || user.myInteractions.reposted;
                case 'high-engagement':
                    return (user.myInteractions.liked && user.myInteractions.commented) || user.myInteractions.reposted;
                default:
                    return true;
            }
        })
        .sort((a, b) => {
            const direction = sortDirection === 'desc' ? -1 : 1;

            switch (sortBy) {
                case 'engagement':
                    return (b.engagementScore - a.engagementScore) * direction;
                case 'followers':
                    return (b.followersCount - a.followersCount) * direction;
                case 'following':
                    return (b.followsCount - a.followsCount) * direction;
                case 'recent':
                    return ((b.interactions.total || 0) - (a.interactions.total || 0)) * direction;
                default:
                    return 0;
            }
        });
}, [localUsers, selectedCategory, debouncedSearchQuery, interactionFilter, sortBy, sortDirection]); // Use localUsers in dependencies

  const handlePinUser = async (user: User, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!agent) return;

    try {
      setPinnedUsers(prev => new Set([...prev, user.did]));
      setNotification({
        message: `${user.displayName || user.handle} has been pinned`,
        type: 'success'
      });
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      console.error('Error pinning user:', err);
      setNotification({
        message: 'Failed to pin user. Please try again.',
        type: 'error'
      });
      setTimeout(() => setNotification(null), 3000);
    }
  };
 
// Update the handleUserClick function
const handleUserClick = (user: User) => {
  //console.log('User clicked:', user);
  setSelectedUser(user);
  onUserClick?.(user);
};

//===================================
//start handle user refresh
// Add to UsersGrid.tsx
//===================================  

const handleUserRefresh = async () => {
  if (!agent || !user) return;
  
  setLoading(true); // Show loading state
  
  try {
    // Get user's recent posts first
    const timeline = await agent.getAuthorFeed({
      actor: agent.session?.handle,
      filter: 'posts_no_replies',
      limit: 50
    });

    // Create map for batch processing
    const userInteractions = new Map();  
    
    
    // Process posts in parallel
    await Promise.all(timeline.data.feed.map(async (item) => {
      const post = item.post;
      
      // Get interactions in parallel
      const [likes, thread] = await Promise.all([
        agent.getLikes({ uri: post.uri }),
        agent.getPostThread({ uri: post.uri, depth: 1 })
      ]);

      // Process each interacting user
      likes.data.likes.forEach(like => {
        const userData = userInteractions.get(like.actor.did) || {
          liked: false,
          commented: false,
          reposted: false,
          counts: { likes: 0, comments: 0, reposts: 0 }
        };
        userData.liked = true;
        userData.counts.likes++;
        userInteractions.set(like.actor.did, userData);
      });

      // Process comments
      thread.data.thread.replies?.forEach(reply => {
        const userData = userInteractions.get(reply.post.author.did) || {
          liked: false,
          commented: false,
          reposted: false,
          counts: { likes: 0, comments: 0, reposts: 0 }
        };
        userData.commented = true;
        userData.counts.comments++;
        userInteractions.set(reply.post.author.did, userData);
      });
    }));

    // Update local users with new interaction data
    setLocalUsers(prevUsers => 
      prevUsers.map(user => {
        const interactions = userInteractions.get(user.did);
        if (!interactions) return user;

        return {
          ...user,
          myInteractions: {
            liked: interactions.liked,
            commented: interactions.commented,
            reposted: interactions.reposted
          },
          interactions: {
            ...user.interactions,
            likes: interactions.counts.likes,
            comments: interactions.counts.comments,
            reposts: interactions.counts.reposts
          }
        };
      })
    );

    setNotification({
      message: 'User interactions refreshed successfully',
      type: 'success'
    });
  } catch (err) {
    console.error('Error refreshing interactions:', err);
    setNotification({
      message: 'Failed to refresh interactions',
      type: 'error'
    });
  } finally {
    setLoading(false);
  }
};
//======================
//end handle user refresh
//======================

if (usersLoading) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] bg-white/50 rounded-lg">
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
      <p className="text-sm text-gray-500">
        {isGatheringData 
          ? "Gathering Bluesky Data..."
          : "Loading user interactions..."
        }
      </p>
    </div>
  );
}
  
  
  {/*  
if (usersLoading) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] bg-white/50 rounded-lg">
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
      <p className="text-sm text-gray-500">Loading user interactions...</p>
    </div>
  );
}  
  */}
// Add the UserAnalyticsSidebar to the JSX
return (
  <div className="flex relative">
    {selectedUser && (
      <div 
        data-testid="user-analytics-sidebar"
        className="fixed width-450 left-384 top-0 h-screen transition-transform duration-300 transform">
        <UserAnalyticsSidebar
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      </div>
    )}
     
    {/* Rest of the existing UsersGrid JSX */}
    <div className={`space-y-6 border border-gray-50 transition-all ${
      selectedUser ? 'ml-[480px]' : 'mr-[0px]'
    }`}>

    {/*<div className={`bg-gradient-to-l from-white via-gray-100 to-blue-100 space-y-3 bg-gray-50/50 p-3 rounded-xl flex-1 space-y-6 transition-all ${
  selectedUser ? 'ml-[480px]' : 'mr-[0px]'}`}>*/}
      
      {/*Start Existing grid content */}
 <div className="text-sm text-gray-500 sticky top-0 space-y-6">
      <UsersSearchBar placeholder="Search for users by name, bio or handle " onSearch={setSearchQuery} />
      
      {/* Categories */}
      <div className="flex items-center space-x-4 mb-6">
        {categories.map(({ id, label, icon: Icon }) => (
        <div key={id}> {/* Wrapper div */}
          <button
            key={id}
            onClick={() => setSelectedCategory(id as typeof selectedCategory)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm ${
              selectedCategory === id
                ? 'text-white'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Icon className="w-6 h-6 text-blue-500" />
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-1">
            <span>{label}</span>
            </h2>        
          </button>
    <p className="px-5 text-gray-500 text-sm font-normal mt-0.5"> 
        Never miss a post from your biggest supporters on Bluesky
    </p>
    </div>
        ))}
        
    </div>

{/* Start Legend */}
<div className="mb-4">
  <button
    onClick={() => setIsLegendExpanded(!isLegendExpanded)} // Add this state
    className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg shadow-sm hover:bg-gray-100 transition-all"
  >
    <div className="flex items-center space-x-2">
      <Lightbulb className="w-4 h-4 text-blue-500" />
      <h3 className="text-sm font-medium text-blue-500">
        Learn what each user interaction status means . . .
      </h3>
    </div>
    <ChevronDown 
      className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
        isLegendExpanded ? 'rotate-180' : ''
      }`}
    />
  </button>

  <div className={`transition-all duration-200 ease-in-out overflow-hidden ${
    isLegendExpanded 
      //? 'max-h-[200px] opacity-100' 
      ? 'max-h-fit opacity-100'
      : 'max-h-0 opacity-0'
  }`}>
    <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-b-lg border-t border-gray-100">
      {[
        {
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />,
          label: "Engaged: Liked AND Commented",
          bgColor: "bg-blue-100",
          textColor: "text-blue-500",
          description: "You've liked and commented on their latest post"
        },
        {
          icon: <AlertCircle className="w-3.5 h-3.5 text-red-400" />,
          label: "Not Engaged: No interactions",
          bgColor: "bg-red-100",
          textColor: "text-red-400",
          description: "No interaction recorded on their latest post"
        },
        {
          icon: <AlertCircle className="w-3.5 h-3.5 text-yellow-600" />,
          label: "Partial: Liked OR Commented",
          bgColor: "bg-yellow-100",
          textColor: "text-yellow-600",
          description: "You've engaged via like/comment on their post"
        },
        {
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />,
          label: "Reposted: Reposted their post",
          bgColor: "bg-green-100",
          textColor: "text-green-500",
          description: "You've shared their latest post to your feed"
        },
      ].map((item, index) => (
        <div
          key={index}
          className={`flex items-center space-x-2 p-3 rounded-lg ${item.bgColor} hover:shadow-sm transition-all min-w-[360px]`}
        >
          <div className="flex items-center space-x-2">
            {item.icon}
            <div>
              <span className={`text-xs font-medium ${item.textColor}`}>
                {item.label}
              </span>
              <p className="text-xs text-gray-500 mt-0.5">
                {item.description}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
</div>
{/* End Legend */}


   {/*Start Show Activity Hours*/}  
  {showActivityHours && !activityLoading && activityStats.topHours.length > 0 && (
    // Activity Hours Stats Panel
<div className="bg-white rounded-lg p-4 mb-4">
   <div className="flex justify-between items-start mb-2">
    <div className="flex flex-col mb-2"> {/* Use flex-col and remove justify-between */}
        <h3 className="text-sm font-medium text-blue-500 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Peak Engagement Times
        </h3>
        <p className="text-gray-400 text-xs font-normal mt-1"> {/* Adjusted mt-1 */}
            Discover the best times to engage with your audience 💡
        </p>
    </div>

  {/*Add Close Button Here*/}
        
        <button 
            onClick={() => setShowActivityHours(false)}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
            <X className="w-4 h-4 text-gray-400" />
        </button>
  {/*End of adding close button*/}
   </div>
        <div className="grid grid-cols-3 gap-4">
        {activityStats.topHours.map(({ hour, minutes, count, percentage }) => (
  <div key={`${hour}-${minutes}`} 
    className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-3 text-center">
    <div className="text-sm font-medium text-white">
      {formatHour(hour, minutes)}
                    </div>
                    <div className="text-xs text-gray-50 mt-1">
                        {count} interactions
                    </div>
                    <div className="text-xs text-blue-400">
                        {percentage.toFixed(1)}% of activity
                    </div>
                </div>
            ))}
        </div>

        <p className="text-xs text-gray-400 mt-2">
            Based on {activityStats.totalInteractions} total interactions
        </p>
    </div>
)}
   {/*End Show Activity Hours*/}
   
  
{/* Sorting and Filtering Controls */}
<div className="flex flex-col space-y-4 p-4 rounded-lg">
    <div className="flex flex-wrap items-center text-blue-500"> {/* Removed justify-between */}
        <div className="flex items-center space-x-4">
            {/* Sorting Options */}
            <div className="flex items-center space-x-2">
                <ArrowUpDown className="w-4 h-4" />
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="text-sm border-none bg-transparent focus:ring-0"
                >
                    {sortOptions.map(option => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <button
                    onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                    className="p-1 hover:bg-gray-200 rounded"
                >
                    {sortDirection === 'asc' ? '↑' : '↓'}
                </button>
            </div>

            {/* Filtering Options */}
            <div className="flex items-center space-x-2 bg-blue-75 rounded">
                <Filter className="w-4 h-4" />
                <select
                    value={interactionFilter}
                    onChange={(e) => setInteractionFilter(e.target.value as InteractionFilter)}
                    className="text-sm border-none bg-transparent focus:ring-0"
                >
                    {interactionOptions.map(option => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Users Found Count and Icon */}
            <div className="flex items-center space-x-1">
                <span className="text-sm">{filteredAndSortedUsers.length} users found</span>
                <Users className="w-4 h-4" /> {/* Add Users Icon */}
            </div>
        </div>
    </div>

    {/* Refresh Button Row */}
    <div className="flex justify-start gap-4 p-4">
        <button
            onClick={handleUserRefresh}
            disabled={loading}
            className="p-2 text-white bg-blue-500 hover:bg-blue-600 rounded flex items-center space-x-2"
        >
            <RefreshCw className="w-3 h-3" />
            <span className="text-sm">{loading ? 'Refreshing...' : 'Refresh Interactions'}</span>
        </button>
      
        <button
            onClick={handlePeakHours}
            disabled={activityLoading}
            className="p-2 text-white bg-gray-900 hover:bg-gray-700 rounded flex items-center space-x-2"
        >
    <Clock className="w-3 h-3" />
    <span className="text-sm">{activityLoading ? 'Refreshing Time...' : 'Show Peak Hours'}</span>
        </button>
      
    </div>
    
</div>  
   
      {/*
  <div className="flex items-center text-blue-500 justify-between  p-4 rounded-lg">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <ArrowUpDown className="w-4 h-4" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="text-sm border-none bg-transparent focus:ring-0"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="p-1 hover:bg-gray-200 rounded"
            >
              {sortDirection === 'asc' ? '↑' : '↓'}
            </button>
          </div>

          <div className="flex items-center space-x-2 bg-blue-75 rounded">
            <Filter className="w-4 h-4" />
            <select
              value={interactionFilter}
              onChange={(e) => setInteractionFilter(e.target.value as InteractionFilter)}
              className="text-sm border-none bg-transparent focus:ring-0"
            >
              {interactionOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          {/*Add a Refresh Button here*/}
      {/*
            <div className="flex items-center space-x-2 bg-blue-75 rounded">
            <button 
                onClick={handleUserRefresh}
                disabled={loading}
                className="p-1 text-white bg-blue-500 hover:bg-blue-600 rounded flex items-center space-x-2"
            > 
              
                <Repeat className="w-4 h-4" />
                <span>{loading ? 'Refreshing...' : 'Refresh User Interactions'}</span>
              </button>
              
            </div>
          
        </div>

        <div className="flex items-center text-sm text-blue-500 space-x-2">
            {filteredAndSortedUsers.length} users found
        </div>
    
      </div>
   */}

      {/* Users Grid 
          <div className={`grid ${
      selectedFeed 
    ? 'grid-cols-1 md:grid-cols-2' 
    : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
} gap-4 transition-all duration-300`}> 
      */}


   {/*<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">*/}

  <div className={`grid ${
    selectedUser
    ? 'grid-cols-1 md:grid-cols-1'
    : 'grid grid-cols-1 md:grid-cols-2' //lg:grid-cols-3
    } gap-4 transition-all duration-300`}> 
    
   {filteredAndSortedUsers.map((user) => (
          <UserCard
            key={user.did}
            user={user}
            isPinned={pinnedUsers.has(user.did)}
            onPin={handlePinUser}
            onClick={() => handleUserClick(user)}
            onFollowChange={(following) => {
            // Update local state to reflect follow status change
              setUsers(prevUsers => 
              prevUsers.map(u => 
              u.did === user.did 
          ? { ...u, isFollowing: following }
          : u
                )
              );
            }}
            onInteractionUpdate={(updates) => handleInteractionUpdate(user.did, updates)}
            />
        ))}
      </div>

      {filteredAndSortedUsers.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No users found matching your criteria
        </div>
      )}
    </div>

      {/*End Existing Grid Content*/}

      {/*proposed spot for gradient end*/}
    </div>
  </div>
);
}