import React, { useState } from 'react';
import { useAuthStore } from '../../auth';
import { Users, UserPlus, Compass, Sparkles, Pin, Send, Activity, Pen, SquarePen, TrendingUp} from 'lucide-react';
import { formatNumber } from '../../utils/formatters';
import { ActivityTracker } from './ActivityTracker';
import { CreatePostModal } from './CreatePostModal';
import { AccordionSection } from './AccordionSection';
import { GrowAudienceModal } from './GrowAudienceModal';

interface ProfilePanelProps {
  onFeedTypeChange: (type: 'popular' | 'suggested' | 'create' | 'pinned') => void;
}

export default function ProfilePanel({ onFeedTypeChange }: ProfilePanelProps) {
  const { user } = useAuthStore();
  const [notification, setNotification] = useState<string | null>(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isGrowModalOpen, setIsGrowModalOpen] = useState(false);

  const handleGrowClick = () => {
    setIsGrowModalOpen(true);
  };

  if (!user) return null;

  return (
    <div className="bg-gradient-to-r from-white via-gray-100 to-blue-100 space-y-3 bg-gray-50/50 p-3 rounded-xl">
      {/* Profile Header */}
      <div className="bg-white rounded-xl p-3 shadow-sm">
        <div className="flex items-start space-x-3">
          <img
            src={user.avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100&h=100&fit=crop'}
            alt={user.handle}
            className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
          />
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-gray-900 truncate">{user.displayName}</h2>
            <p className="text-xs text-gray-500 truncate">@{user.handle}</p>
            
            <div className="mt-2 flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                <div className="p-1 bg-blue-50 rounded-lg">
                  <Users className="w-3 h-3 text-blue-500" />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-900">
                    {formatNumber(user.followersCount)}
                  </div>
                  <div className="text-[10px] text-gray-500">Followers</div>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <div className="p-1 bg-green-50 rounded-lg">
                  <UserPlus className="w-3 h-3 text-green-500" />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-900">
                    {formatNumber(user.followsCount)}
                  </div>
                  <div className="text-[10px] text-gray-500">Following</div>
                </div>
              </div>
            </div>

            {user.description && (
              <p className="text-[11px] text-gray-600 mt-2 line-clamp-2">{user.description}</p>
            )}
            <button
              onClick={handleGrowClick}
              className="flex-1 flex items-center justify-center text-xs font-normal space-x-1 px-2 py-3 bg-gray-800 text-white hover:bg-gray-700 rounded transition-colors mt-8"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Grow with Klaowt</span>
            </button>
          </div>
        </div>
      </div>

      {/* Activity Tracker Accordion */}
      <AccordionSection 
        title="Track Activity" 
        icon={<Activity className="w-4 h-4 text-blue-500" />}
        defaultExpanded={true}
      >
        <ActivityTracker />
      </AccordionSection>

      {/* Browse My Feeds Accordion */}
      <AccordionSection 
        title="Browse Feeds" 
        icon={<Compass className="w-4 h-4 text-blue-500"/>}
        defaultExpanded={false}
      >
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onFeedTypeChange('popular')}
            className="inline-flex items-center px-4 py-2 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            <Compass className="w-3 h-3 mr-2" />
            <span className="text-xs">Popular Feeds</span>
          </button>
          <button
            onClick={() => onFeedTypeChange('suggested')}
            className="inline-flex items-center px-4 py-2 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            <Sparkles className="w-3 h-3 mr-2" />
            <span className="text-xs">Suggested Feeds</span>
          </button>
          <button
            onClick={() => onFeedTypeChange('pinned')}
            className="inline-flex items-center px-4 py-2 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            <Pin className="w-3 h-3 mr-2" />
            <span className="text-xs">Pinned Feeds</span>
          </button>
        </div>
      </AccordionSection>
   
      {/* New Post Button */}
      <button 
        onClick={() => setIsPostModalOpen(true)}
        className="w-full flex items-center justify-center text-sm font-medium space-x-2 px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded transition-colors mx-auto"
      >
        <SquarePen className="w-3 h-3" />
        <span>New Post</span>
      </button>
      
      <CreatePostModal 
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
      />

      <GrowAudienceModal 
        isOpen={isGrowModalOpen}
        onClose={() => setIsGrowModalOpen(false)}
      />
    </div>
  );
}