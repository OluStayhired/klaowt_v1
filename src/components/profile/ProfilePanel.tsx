import React, { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '../../auth';
import { Users, UserPlus, UserCheck, UserSearch, Compass, Sparkles, Pin, Send, Activity, Pen, SquarePen, TrendingUp, Clock, Heart, Loader, Loader2, BarChart2 } from 'lucide-react';
import { Flame } from 'lucide-react';
import { Target } from 'lucide-react';
import { formatNumber } from '../../utils/formatters';
import { ActivityTracker } from './ActivityTracker';
import { CreatePostModal } from './CreatePostModal';
import { AccordionSection } from './AccordionSection';
import { GrowAudienceModal } from './GrowAudienceModal';
import { PeakTimeModal } from './PeakTimeModal';
import { PostEngagementModal } from './PostEngagementModal';
import { Line } from 'react-chartjs-2';
import { format, subDays, startOfDay, parseISO } from 'date-fns';
import { useFollowerGrowth } from '/src/hooks/useFollowerGrowth'
//import { FollowerGrowth } from './FollowerGrowth';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

interface ProfilePanelProps {
  onFeedTypeChange: (type: 'popular' | 'suggested' | 'create' | 'pinned' | 'personal') => void;
}

export default function ProfilePanel({ onFeedTypeChange }: ProfilePanelProps) {
  const { user } = useAuthStore();
  const [notification, setNotification] = useState<string | null>(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isGrowModalOpen, setIsGrowModalOpen] = useState(false);
  const [isPeakModalOpen, setIsPeakModalOpen] = useState(false);
  const [isPostEngagementModalOpen, setIsPostEngagementModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  //const [growthError, setGrowthError] = useState<string | null>(null);


// New state for time range
const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('7d');
  
const { data: growthData, loading: growthLoading, error: growthError } = useFollowerGrowth(user.did, timeRange); //add timeRange here

// Time range options
const timeRangeOptions = [
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' }, 
  { value: '90d', label: '90d' },
  { value: 'all', label: 'All' }
];
  

   function wrapText(text, charsPerLine) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';

        words.forEach(word => {
            if (currentLine.length + word.length + 1 <= charsPerLine) {
                currentLine += (currentLine ? ' ' : '') + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        });

        if (currentLine) {
            lines.push(currentLine);
        }

        return lines;
    }

      // Add the useEffect here:
    //useEffect(() => {
     //   console.log("Growth Data:", growthData);
    //}, [growthData]);

  // Add this to the useMemo for chartData
const filterDataByTimeRange = (data) => {
  const now = new Date();
  let filterDate;

  //console.log("Time Range:", timeRange); // Log the timeRange
  
  switch (timeRange) {
    case '7d':
      filterDate = subDays(now, 7);
      break;
    case '30d':
      filterDate = subDays(now, 30);
      break;
    case '90d':
      filterDate = subDays(now, 90);
      break;
    default:
      return data; // Return all data
  }

  //console.log("Now:", now);
   // console.log("Filter Date:", filterDate);

    return data.filter(d => {
        //console.log("Timestamp:", d.timestamp);
        const parsedDate = parseISO(d.timestamp);
        //console.log("Parsed Date:", parsedDate);
        const isIncluded = parsedDate >= filterDate;
        //console.log("Is Included:", isIncluded);
        return isIncluded;
    });
  
  //return data.filter(d => parseISO(d.timestamp) >= filterDate);
  
};

//const filteredData = growthData?.followers 
  //? filterDataByTimeRange(growthData.followers)
  //: [];

const filteredData = useMemo(() => {
        if (!growthData?.followers) return [];
        console.log("growthData.followers:", growthData.followers); // Added console log
        return filterDataByTimeRange(growthData.followers);
    }, [growthData?.followers, timeRange]);
 
const chartData = useMemo(() => ({
 labels: filteredData.map(d => format(new Date(d.timestamp), 'MMM d')),
  datasets: [{
      label: 'Engagement',
      data: filteredData.map(d => d.engagement),
      fill: true,
      borderColor: 'rgb(33, 150, 243)', 
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      //borderDash: [5, 5],
      tension: 0.4,
      yAxisID: 'engagement'
    }],
  highestEngagementPost: growthData?.highestEngagementPost // Add highest post data
}), [filteredData, timeRange]);

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
          bottom: 50       
      }
    },
    plugins: {
        tooltip: {
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            titleColor: '#1f2937',
            bodyColor: '#6b7280',
            borderColor: '#e5e7eb',
            borderWidth: 1,
            padding: 12,
            position: 'nearest', // Ensure nearest mode
            yAlign: 'bottom',
            callbacks: {
                label: (context: any) => {
                    const label = context.dataset.label;
                    const value = context.raw;
                    const growth = context.dataIndex > 0
                        ? ((value - context.dataset.data[context.dataIndex - 1]) / context.dataset.data[context.dataIndex - 1] * 100).toFixed(1)
                        : 0;
                    let lines = [`${label}: ${value} (${growth}% growth)`]; // Start with an array

                    if (growthData?.dailyHighestPosts && context.dataIndex !== undefined) {
                        const tooltipLabel = context.label;
                        const dailyHighestPost = growthData.dailyHighestPosts[tooltipLabel];

                          if (dailyHighestPost) {
                            const postText = dailyHighestPost.text;
                            const charsPerLine = 50;
                            const wrappedText = wrapText(postText, charsPerLine);
                            lines.push("   "); // Add title
                            lines.push("💡Highest Engagement Post");
                            //lines.push("Highest Engagement Post:"); 
                            // Add title
                            //lines.push("   "); // Add title
                            // Add wrapped post text
                            wrappedText.forEach(line => lines.push(line)); 
                            }
                    }

                    return lines; // Return the array
                },
                // Removed footer callback
            },
            font: {
                family: 'Arial'
            }
           //maxWidth: 100 // Adjust this value as needed
        }
    },
    scales: {
        y: {
            beginAtZero: true,
            grid: {
                color: 'rgba(0, 0, 0, 0.05)',
            }
        },
        engagement: {
            position: 'right' as const,
            beginAtZero: true,
            grid: {
                display: false
            }
        }
    }
};

  const handleGrowClick = () => {
    setIsGrowModalOpen(true);
  };

  const handlePeakTimeClick = () => {
    setIsPeakModalOpen(true);
  };

  const handlePostEngagementClick = () => {
    setIsPostEngagementModalOpen(true);
  };



  if (!user) return null;

  return (
     <div className="overflow-y-auto max-h-[100vh]  [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-400"> {/* modified scrollbar Scrollable container */}
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
                  <UserPlus className="w-3 h-3 text-blue-500" />
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
                  <UserCheck className="w-3 h-3 text-green-500" />
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
              <Target className="w-4 h-4" />
              <span>Start Focused Mode</span>
            </button>
          </div>
        </div>
      </div>

      {/* Activity Tracker Accordion */}
 <AccordionSection 
  title="Track Activity" 
  icon={<Activity className="w-4 h-4 text-blue-500" />}
  defaultExpanded={false}
>
  <div className="space-y-4">
    <ActivityTracker />
  
  </div>
</AccordionSection>

       <AccordionSection 
        title="Analyze Posts" 
        icon={<BarChart2 className="w-4 h-4 text-blue-500" />}
        defaultExpanded={false}
      >
  <div className="space-y-4">
    {/* Growth Metrics Section */}
    <div className="bg-white rounded-xl p-4 shadow-sm">
      {growthLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
        </div>
      ) : growthError ? (
        <div className="text-red-500 text-sm text-center py-4">
          {growthError}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 mb-4">
            
            {/*<div className="text-center">
              <p className="text-sm text-gray-500">Growth Rate</p>
              <p className="text-2xl font-bold text-blue-500">
                {growthData?.metrics.growthRate.toFixed(1)}%
              </p>
            </div>*/}
            
            <div className="text-left">
              <p className="text-sm text-gray-600">Post Engagement Rate</p>
              <p className="text-xs text-gray-400 rounded-full py-1 mt-1 inline-block">
              Dive deeper into your most engaging posts 💡
              </p>
              <p className="text-2xl rounded-lg p-1 text-center font-bold text-blue-500">
                {growthData?.metrics.engagementRate.toFixed(1)}%
              </p>
            </div>
          </div>

          {/*// Add this above the engagement rate chart*/}
<div className="flex items-center justify-between mb-4">
  <div className="flex space-x-2">
    {timeRangeOptions.map(option => (
      <button
        key={option.value}
        onClick={() => setTimeRange(option.value)}
        className={`px-3 py-1 text-xs rounded-full transition-colors ${
          timeRange === option.value
            ? 'bg-blue-500 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        {option.label}
      </button>
    ))}
  </div>
</div>

          {/*Engagement Rate Chart*/}
          <div className="overflow-visible">
            <Line 
              data={chartData}
              options={chartOptions}
            />
          </div>
    <button 
       onClick={handlePostEngagementClick}
      className="flex-1 flex items-center bg-blue-500 text-white text-xs rounded space-x-2 px-4 py-2 py-2 mt-4">
        <BarChart2 className="w-3 h-3" />
        <span>Start Analysis</span>
      </button>
        </>
      )}
    </div>
  </div>
      </AccordionSection>   

      <AccordionSection 
        title="Discover Friends" 
        icon={<UserSearch className="w-4 h-4 text-blue-500" />}
        defaultExpanded={false}
      >
        <div className="flex flex-col gap-2">

          <div className="text-left">
              <p className="text-sm text-gray-600">Build Relationships Faster</p>
              <p className="text-xs text-gray-400 rounded-full py-1 mt-1 inline-block">
              Never miss a post from your biggest supporters 💡
          </p>
          </div>
          <div>
          <button
              onClick={() => onFeedTypeChange('personal')}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
>
              <Heart className="w-3 h-3 mr-2" />
              <span className="text-xs">
                   {loading ? 'Loading...' : 'Browse Top Friends'}
              </span>
          </button>
            </div>

        </div>
      </AccordionSection>

      {/* Browse My Feeds Accordion */}
      <AccordionSection 
        title="Browse Feeds" 
        icon={<Compass className="w-4 h-4 text-blue-500"/>}
        defaultExpanded={false}
      >
        <div className="flex flex-col gap-2">
          <div className="text-left">
              <p className="text-sm text-gray-600">Join Trending Conversations</p>
              <p className="text-xs text-gray-400 rounded-full py-1 mt-1 inline-block">
              Discover top creators & trending posts from over 1000 feeds 💡
          </p>
          </div>
          <div className="flex flex-col gap-2">
          <button
            onClick={() => onFeedTypeChange('popular')}
            className="inline-flex items-center px-4 py-2 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            <Compass className="w-3 h-3 mr-2" />
            <span className="text-xs">Popular Feeds</span>
          </button>

          <button
            onClick={() => onFeedTypeChange('pinned')}
            className="inline-flex items-center px-4 py-2 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            <Pin className="w-3 h-3 mr-2" />
            <span className="text-xs">Pinned Feeds</span>
          </button>
        </div>
        </div>
      </AccordionSection>
   
  
 {/* Buttons Container */}
  <div className="flex gap-2"> {/* Flex container with gap */}
       {/* New Post Button */}
          <button
              onClick={() => setIsPostModalOpen(true)}
              className="flex-1 flex items-center justify-center text-xs font-normal space-x-2 px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded transition-colors"
                >
               <SquarePen className="w-3 h-3" />
               <span>New Post</span>
           </button>

                {/* Best Posting Times Button */}
           <button
               onClick={() => setIsPeakModalOpen(true)}
               className="flex-1 flex items-center justify-center text-xs font-normal space-x-2 px-4 py-2 bg-gray-800 text-white hover:bg-gray-700 rounded transition-colors"
                >
               <Clock className="w-3 h-3" />
               <span>Peak Times</span>
           </button>
            </div>
      
      <CreatePostModal 
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
      />

      <GrowAudienceModal 
        isOpen={isGrowModalOpen}
        onClose={() => setIsGrowModalOpen(false)}
      />

      <PeakTimeModal
        isOpen={isPeakModalOpen}
        onClose={() => setIsPeakModalOpen(false)}
      />

       <PostEngagementModal
        isOpen={isPostEngagementModalOpen}
        onClose={() => setIsPostEngagementModalOpen(false)}
      />
    </div>
  </div>
  );
}