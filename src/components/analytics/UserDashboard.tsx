// src/components/analytics/UserDashboard.tsx
import React, { useRef, useEffect } from 'react';
import { 
  TrendingUp, Users, MessageCircle, Heart, 
  Repeat2, Calendar, Clock, Activity, 
  ArrowUp, ArrowDown, Flame, BarChart, BarChart2
} from 'lucide-react';
import { formatNumber } from '../../utils/formatters';
import { Line } from 'react-chartjs-2';
import { useUserAnalytics } from '../../hooks/useUserAnalytics';
import { useUserSuggested } from '../../hooks/useUserSuggested';
import { useAuthStore } from '../../auth';
import { User } from '../../types/user';
import { Chart, registerables } from 'chart.js';
import {
    LinearScale,
    CategoryScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend
} from 'chart.js'; // Correct import path

// Register specific scales and elements
Chart.register(
    LinearScale,
    CategoryScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend
);

interface UserDashboardProps {
  user: User;
}

export function UserDashboard({ user }: UserDashboardProps) {
   const chartRef = useRef<any>(null); 
  const { data: analytics, loading: analyticsLoading } = useUserAnalytics(user.handle);
  const { suggestedUsers, loading: suggestedLoading } = useUserSuggested(user.did);
  const { agent } = useAuthStore();

  useEffect(() => {
        return () => {
            if (chartRef.current) {
                chartRef.current.destroy(); // Destroy the chart instance on unmount
            }
        };
    }, []);

  // Activity chart data
  const activityData = {
    labels: Object.keys(analytics?.activityByHour || {}).sort(),
    datasets: [{
      label: 'Activity',
      data: Object.values(analytics?.activityByHour || {}),
      fill: true,
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
       x: { // Add configuration for the x-axis
            title: {
                display: true,
                text: 'Hours of the Day' // Set the x-axis title
            }
        },
      y: { 
        beginAtZero: true,
        ticks: {
          stepSize: 1
        },
         title: {
                display: true,
                text: 'User Activity over 24hrs' // Set the y-axis title
            }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <Users className="w-6 h-6 opacity-80" />
            <div className="bg-white/20 rounded-full px-2 py-1 text-xs">
              {user.followersCount > user.followsCount ? '+' : '-'}
              {Math.abs(user.followersCount - user.followsCount)}
            </div>
          </div>
          <h3 className="text-2xl font-bold mt-2">{formatNumber(user.followersCount)}</h3>
          <p className="text-sm opacity-80">Total Followers</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <Activity className="w-6 h-6 opacity-80" />
            <div className="bg-white/20 rounded-full px-2 py-1 text-xs">
              {user.engagementScore}%
            </div>
          </div>
          <h3 className="text-2xl font-bold mt-2">{formatNumber(user.interactions.total)}</h3>
          <p className="text-sm opacity-80">Total Interactions</p>
        </div>
      </div>

      {/* Engagement Metrics */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-sm font-semibold text-blue-500">Engagement Overview 💡</h3>
        <p className="text-xs text-gray-400 mb-4">
          View likes & comments received from this user
        </p>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="bg-red-50 w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Heart className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-xl font-semibold text-gray-900">
              {formatNumber(user.interactions.likes)}
            </p>
            <p className="text-xs text-gray-500">Total Likes</p>
          </div>
          <div className="text-center">
            <div className="bg-blue-50 w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2">
              <MessageCircle className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-xl font-semibold text-gray-900">
              {formatNumber(user.interactions.comments)}
            </p>
            <p className="text-xs text-gray-500">Total Comments</p>
          </div>
          <div className="text-center">
            <div className="bg-green-50 w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Repeat2 className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-xl font-semibold text-gray-900">
              {formatNumber(user.interactions.reposts)}
            </p>
            <p className="text-xs text-gray-500">Total Reposts</p>
          </div>
        </div>
             {/* Engagement Score */}
      <div className="bg-white rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-normal text-blue-500">Interaction Score </h3>
          <div className="flex items-center bg-blue-50 rounded-lg space-x-2">
            <BarChart2 className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-blue-500 font-medium">{user.engagementScore}%</span>
          </div>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
            style={{ width: `${user.engagementScore}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Based on this user's likes & comments on your posts
        </p>
      </div>
        {/*End Interaction Score*/}
      </div>

      {/* Activity Chart */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-blue-500">User Activity Distribution 💡</h3>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-blue-500">24-hour activity</span>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>     
        </div>
          <p className="text-xs text-gray-400 mb-4">
          Monitor this user's activity over 24hrs  
        </p>
        <div className="h-48">
          <Line data={activityData} options={chartOptions} />
        </div>
      </div>

      {/* Interaction Status */}
      <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-sm font-semibold text-blue-500">My Interactions 💡</h3>
            <p className="text-xs text-gray-400 mb-4">
                  View my interactions with this user's last post
              </p>
            
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Heart className={`p-0.5 w-4 h-4 ${user.myInteractions.liked ? 'text-red-500 fill-current' : 'text-red-400 bg-red-100 rounded'}`} />
              <span className="text-sm text-gray-400">Liked Content</span>
            </div>
            <span className={`text-xs ${user.myInteractions.liked ? 'text-green-500' : 'text-gray-500'}`}>
              {user.myInteractions.liked ? 'Engaged' : 'Not Yet'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageCircle className={`p-0.5 w-4 h-4 ${user.myInteractions.commented ? 'text-blue-500 fill-current' : 'text-blue-400 bg-blue-100 rounded'}`} />
              <span className="text-sm text-gray-400">Commented</span>
            </div>
            <span className={`text-xs ${user.myInteractions.commented ? 'text-green-500' : 'text-gray-500'}`}>
              {user.myInteractions.commented ? 'Engaged' : 'Not Yet'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Repeat2 className={`p-0.5 w-4 h-4 ${user.myInteractions.reposted ? 'text-green-500' : 'text-green-400 bg-green-100 rounded'}`} />
              <span className="text-sm text-gray-400">Reposted</span>
            </div>
            <span className={`text-xs ${user.myInteractions.reposted ? 'text-green-500' : 'text-gray-500'}`}>
              {user.myInteractions.reposted ? 'Engaged' : 'Not Yet'}
            </span>
          </div>
        </div>
      </div>

      {/* Engagement Score */}
      {/*<div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-blue-500">Interaction Score </h3>
          <div className="flex items-center bg-blue-50 rounded-lg space-x-2">
            <BarChart2 className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-blue-500 font-medium">{user.engagementScore}%</span>
          </div>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
            style={{ width: `${user.engagementScore}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Based on likes, comments, and reposts on your content
        </p>
      </div>*/}
    </div>
  );
}
