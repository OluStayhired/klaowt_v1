import React, { useState, useEffect } from 'react';
import { X, BarChart3, MessageSquare, Info } from 'lucide-react';
import { User } from '../types/user';
import { UserPostsList } from './UserPostsList';
import { UserInsightsPanel } from './analytics/UserInsightsPanel';
//import { SearchBar } from './SearchBar';
//import { useAuthStore } from '/src/store/authStore';

interface UserAnalyticsSidebarProps {
  user: User;
  onClose: () => void;
}

export function UserAnalyticsSidebar({ user, onClose }: UserAnalyticsSidebarProps) {
  console.log('UserAnalyticsSidebar rendering for user:', user);
  const [activeTab, setActiveTab] = useState<'posts' | 'insights'>('posts');
  const [showTooltip, setShowTooltip] = useState(false);
  //variables for making search work
  //const [searchQuery, setSearchQuery] = useState('');
  //const [comments, setComments] = useState<any[]>([]);
  //const { agent } = useAuthStore();

  // Reset to Posts tab when user changes
  useEffect(() => {
    setActiveTab('posts');
  }, [user.did]);

  useEffect(() => {
  console.timeEnd('sidebar-render');
}, []);

  useEffect(() => {
  if (user) {
    console.log('Fetching analytics data for user:', user.handle);
    // Log network requests
    console.log('Network requests starting for:', {
      userPosts: `/api/users/${user.did}/posts`,
      userAnalytics: `/api/users/${user.did}/analytics`
    });
  }
}, [user]);

 

  return (
    <div className="w-[450px] shadow-xl bg-white border-l border-gray-200 h-screen overflow-hidden flex flex-col [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-400">
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
              src={user.avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100&h=100&fit=crop'}
              alt={user.displayName || user.handle}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <h3 className="font-semibold text-gray-900">{user.displayName || user.handle}</h3>
              <p className="text-sm text-gray-500">@{user.handle}</p>
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
                Recent Posts
                {/*<span 
                  className="flex items-center cursor-pointer hover:text-gray-500"
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                >
                  <Info className="w-3 h-3 text-gray-400 ml-1"/> 
                  {showTooltip && (
                    <div className="flex-1 items-left justify-left absolute ml-5 bg-gray-800 w-half text-xs text-white px-2 py-1 rounded-md shadow-sm max-w-48 max-h-24 z-10 mb-10">
                      View and engage with recent posts
                    </div>
                  )}
                </span>*/}
              </span>
            </div>
          </button>
          
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
              <span>Insights</span>
            </div>
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-400">
        <div className="p-4">
          {activeTab === 'posts' ? (
            <UserPostsList 
              userHandle={user.handle}
              userName={user.displayName || user.handle}
            />
          ) : (
              <UserInsightsPanel user={user} />
          )}
        </div>
      </div>
    </div>
  );
}