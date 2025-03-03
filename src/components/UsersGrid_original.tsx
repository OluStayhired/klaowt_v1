
// Update the onClick handler in UsersGrid.tsx to show the UserAnalyticsSidebar
import React, { useState, useEffect } from 'react';
import { Users, AlertCircle, CheckCircle2, UserPlus, UsersRound, UserCheck, Handshake, ArrowUpDown, Filter, Repeat } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { User } from '../types/user';
import { UserCard } from './users/UserCard';
import { UsersSearchBar } from './users/UsersSearchBar';
import { useAuthStore } from '../auth';
import { usePinnedUsers } from '../hooks/usePinnedUsers';
import { useUsers } from '../hooks/useUsers';
import { useDebounce } from '../hooks/useDebounce';
import { UserAnalyticsSidebar } from './UserAnalyticsSidebar';


interface UsersGridProps {
  users: User[];
  title: string;
  onUserClick?: (user: User) => void;
  loading?: boolean; // Add this if needed
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
    { id: 'All', label: 'Top User Interactions', icon: Users },
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

  {/*
  const filteredAndSortedUsers = React.useMemo(() => {
    return users
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
  }, [users, selectedCategory, debouncedSearchQuery, interactionFilter, sortBy, sortDirection]);
  */}

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
      <p className="text-sm text-gray-500">Loading user interactions...</p>
    </div>
  );
}  
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
 <div className="space-y-6">
      <UsersSearchBar onSearch={setSearchQuery} />
      
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
        Use the insights below to priorize your user engagement 
    </p>
    </div>
        ))}
        
    </div>

   {/*start legend*/}
       <div className="flex items-center space-x-4">
          <div className="p-2 flex ml-4 items-center bg-blue-100 rounded-lg space-x-0.5 p-4 hover:shadow-sm transition-all transform hover:-translate-y-0.5 relative cursor-pointer"
                title="You have Liked AND Commented on their last post"
                style={{ whiteSpace: 'pre-line' }}
            >
              <CheckCircle2 className={"w-3.5 h-3.5 text-blue-500"} />
              <span className="text-xs text-blue-500 ml-1">Engaged</span>
            </div>
         <div className="p-2 flex ml-4 items-center bg-red-100 rounded-lg space-x-0.5  p-4 hover:shadow-sm transition-all transform hover:-translate-y-0.5 relative cursor-pointer border border-red-100"
                title="You have NOT interacted with their last post"
                style={{ whiteSpace: 'pre-line' }}
           >
              <AlertCircle className={"w-3.5 h-3.5 text-red-400"} />
              <span className="text-xs text-red-400 ml-1">Not Engaged</span>
        </div>
         <div className="p-2 flex ml-4 items-center bg-yellow-100 rounded-lg space-x-0.5  p-4 hover:shadow-sm transition-all transform hover:-translate-y-0.5 relative cursor-pointer"
                title="You have EITHER Liked OR Commented on their last post"
                style={{ whiteSpace: 'pre-line' }}
           >
              <AlertCircle className={"w-3.5 h-3.5 text-yellow-600"} />
              <span className="text-xs text-yellow-600 ml-1">Partial</span>
        </div>
          <div className="p-2 flex ml-4 items-center bg-green-100 rounded-lg space-x-0.5  p-4 hover:shadow-sm transition-all transform hover:-translate-y-0.5 relative cursor-pointer border border-green-100"
                title="You have REPOSTED their last post"
                style={{ whiteSpace: 'pre-line' }}
            >
              <CheckCircle2 className={"w-3.5 h-3.5 text-green-500"} />
              <span className="text-xs text-green-500 ml-1">Reposted</span>
          </div>
       </div>      
   {/*end legend*/}

      {/* Sorting and Filtering Controls */}
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