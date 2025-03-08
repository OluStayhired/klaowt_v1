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
        <div className="flex flex-col items-start text-sm">
            <span className="text-gray-600">Hourly Engagement Tracker</span>
            <span className="text-xs text-gray-400 rounded-full py-1 mt-1 inline-block">
              Your engagement with other posts in the last hour 💡
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
           <div className="flex items-center p-1 bg-blue-100 rounded-lg">
              <SquarePen className="w-4 h-4 text-blue-500" />
           </div>
          <span className="text-sm font-normal text-gray-500">Posts Today </span>
        </div>
        <span className="text-sm text-blue-500 font-normal">{formatNumber(todaysPosts)} Post(s)</span>
      </div>
    </div>
  );
}