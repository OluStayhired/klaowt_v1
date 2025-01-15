import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../auth';
import { Activity, MessageSquare, SquarePen, TrendingUp, Info } from 'lucide-react';
import { formatNumber } from '../../utils/formatters';

export function ActivityTracker() {
  const { agent, user } = useAuthStore();
  const [hourlyPoints, setHourlyPoints] = useState(0);
  const [todaysPosts, setTodaysPosts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function fetchActivity() {
      if (!agent || !user) return;

      try {
        const now = new Date();
        const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const startOfDay = new Date(now.setHours(0, 0, 0, 0));

        const response = await agent.getAuthorFeed({
          actor: user.handle,
          limit: 100,
        });

        if (!mounted) return;

        let points = 0;
        let posts = 0;

        response.data.feed.forEach(item => {
          const postDate = new Date(item.post.indexedAt);
          
          if (postDate >= hourAgo) {
            if (item.post.record.$type === 'app.bsky.feed.like') {
              points += 1;
            } else if (item.post.record.$type === 'app.bsky.feed.post') {
              if (item.reply) {
                points += 5;
              }
            }
          }

          if (postDate >= startOfDay && item.post.record.$type === 'app.bsky.feed.post' && !item.reply) {
            posts++;
          }
        });

        if (mounted) {
          setHourlyPoints(points);
          setTodaysPosts(posts);
        }
      } catch (err) {
        console.error('Error fetching activity:', err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchActivity();
    const interval = setInterval(fetchActivity, 60000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [agent, user]);

  const pointsPercentage = Math.min((hourlyPoints / 200) * 100, 100);

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
      {/* Engagement Tracker */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="flex text-gray-600">
            Engagement Meter
            <span className="flex items-center cursor-pointer hover:text-gray-500"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              <Info className="w-3 h-3 text-gray-400 ml-1"/> 
              {showTooltip && (
                <div className="flex-1 absolute ml-5 bg-gray-800 w-full text-xs text-white px-2 py-1 rounded-md shadow-sm max-w-48 max-h-24 z-10 mb-10">
                  Aim for an engagement score of 35% before you post.↗️
                </div>
              )}
            </span>
          </span>
        </div>

        {/* Circular Engagement Meter */}
        <div className="flex justify-center items-center">
          <div className="relative w-24 h-24">
            {/* Background circle */}
            <svg className="w-full h-full">
              <circle
                cx="48"
                cy="48"
                r="44"
                className="stroke-gray-100"
                strokeWidth="8"
                fill="none"
              />
              {/* Progress circle */}
              <circle
                cx="48"
                cy="48"
                r="44"
                className="stroke-blue-500 transition-all duration-500"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                transform="rotate(-90 48 48)"
                strokeDasharray={`${pointsPercentage * 2.76} 276`}
              />
            </svg>
            
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-gray-800">{Math.round(pointsPercentage)}%</span>
              <span className="text-xs text-gray-500">Engaged</span>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Posts */}
      <div className="flex items-center justify-between py-2 border-t border-gray-100">
        <div className="flex items-center space-x-2">
          <SquarePen className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-500">Today's Posts</span>
        </div>
        <span className="text-sm font-medium">{formatNumber(todaysPosts)}</span>
      </div>
    </div>
  );
}