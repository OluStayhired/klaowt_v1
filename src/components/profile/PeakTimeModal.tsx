import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Clock, BarChart2, Loader2, Calendar, 
  Sunrise, Sun, Sunset, Moon, Users, Activity,
  TrendingUp, ArrowUp
} from 'lucide-react';
import { useAuthStore } from '../../auth';
import { Line } from 'react-chartjs-2';

interface PeakTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ActivityData {
  hour: number;
  minutes: number;
  count: number;
  percentage: number;
}

export function PeakTimeModal({ isOpen, onClose }: PeakTimeModalProps) {
  const [loading, setLoading] = useState(false);
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [totalInteractions, setTotalInteractions] = useState(0);
  const { agent, user } = useAuthStore();

  // Format hours in 12-hour format with minutes
  const formatHour = (hour: number, minutes: number = 0) => {
    const ampm = hour >= 12 ? 'pm' : 'am';
    const h = hour % 12 || 12;
    return `${h}:${minutes.toString().padStart(2, '0')}${ampm}`;
  };

  // Get time period icon
  const getTimeIcon = (hour: number) => {
    if (hour >= 5 && hour < 12) return <Sunrise className="w-5 h-5 text-blue-100" />;
    if (hour >= 12 && hour < 17) return <Sun className="w-5 h-5 text-yellow-400" />;
    if (hour >= 17 && hour < 20) return <Sunset className="w-5 h-5 text-blue-200" />;
    return <Moon className="w-5 h-5 text-blue-400" />;
  };

  // Chart data
  const chartData = {
    labels: Array.from({ length: 24 }, (_, i) => formatHour(i)),
    datasets: [{
      label: 'Activity',
      data: Array.from({ length: 24 }, (_, i) => {
        const hourData = activityData.find(d => d.hour === i);
        return hourData?.count || 0;
      }),
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
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  useEffect(() => {
    if (!isOpen || !agent || !user) return;

    const fetchActivityData = async () => {
      setLoading(true);
      try {
        const timeline = await agent.getAuthorFeed({
          actor: user.handle,
          limit: 100
        });

        const hourlyActivity = new Map<number, number>();
        for (let i = 0; i < 24; i++) {
          hourlyActivity.set(i, 0);
        }

        // Process posts in parallel
        await Promise.all(timeline.data.feed.map(async (item) => {
          const [likes, thread] = await Promise.all([
            agent.getLikes({ uri: item.post.uri }),
            agent.getPostThread({ uri: item.post.uri, depth: 1 })
          ]);

          // Process interactions
          likes.data.likes.forEach(like => {
            const hour = new Date(like.createdAt).getHours();
            hourlyActivity.set(hour, (hourlyActivity.get(hour) || 0) + 1);
          });

          thread.data.thread.replies?.forEach(reply => {
            const hour = new Date(reply.post.indexedAt).getHours();
            hourlyActivity.set(hour, (hourlyActivity.get(hour) || 0) + 1);
          });
        }));

        const total = Array.from(hourlyActivity.values()).reduce((sum, count) => sum + count, 0);
        
        const processedData = Array.from(hourlyActivity.entries())
          .map(([hour, count]) => ({
            hour,
            minutes: 0,
            count,
            percentage: (count / total) * 100
          }))
          .sort((a, b) => b.count - a.count);

        setActivityData(processedData);
        setTotalInteractions(total);
      } catch (err) {
        console.error('Error fetching activity data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchActivityData();
  }, [isOpen, agent, user]);

  if (!isOpen) return null;

  const modal = (
    <div className="fixed inset-0 z-[9999] overflow-y-auto  [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-400">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl w-full max-w-3xl shadow-2xl" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center space-x-3">
              <Clock className="w-6 h-6 text-blue-500" />
              <h2 className="text-xl font-semibold">Peak Activity Times</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto  [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-400">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            ) : (
              <>
                {/* Peak Hours */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold">Best Times to Post</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {activityData.slice(0, 3).map((data, index) => (
                      <div key={index} className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                          {getTimeIcon(data.hour)}
                          <div className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">
                            {data.percentage.toFixed(1)}% activity
                          </div>
                        </div>
                        <p className="text-lg text-white font-semibold mt-2">
                          {formatHour(data.hour)}
                        </p>
                        <p className="text-sm text-gray-50">
                          {data.count} interactions
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                {/*End Peak Hours */}
              
                {/* Activity Chart */}
                <div className="bg-white rounded-xl p-6 border">
                  <h3 className="text-sm font-semibold mb-4 flex items-center space-x-2">
                    <BarChart2 className="w-5 h-5 text-blue-500" />
                    <span>24-Hour Activity Distribution</span>
                  </h3>
                  <div className="h-64">
                    <Line data={chartData} options={chartOptions} />
                  </div>
                </div>

                  {/* Overview Cards */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <Activity className="w-5 h-5 text-blue-500" />
                      <span className="text-xs text-blue-500 font-medium">Total</span>
                    </div>
                    <p className="text-2xl font-bold mt-2">{totalInteractions}</p>
                    <p className="text-sm text-blue-600">Interactions</p>
                  </div>

                  <div className="bg-green-50 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <Users className="w-5 h-5 text-green-500" />
                      <span className="text-xs text-green-500 font-medium">Average</span>
                    </div>
                    <p className="text-2xl font-bold mt-2">
                      {Math.round(totalInteractions / 24)}
                    </p>
                    <p className="text-sm text-green-600">Per Hour</p>
                  </div>

                  <div className="bg-purple-50 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <TrendingUp className="w-5 h-5 text-purple-500" />
                      <span className="text-xs text-purple-500 font-medium">Peak</span>
                    </div>
                    <p className="text-2xl font-bold mt-2">
                      {activityData[0]?.count || 0}
                    </p>
                    <p className="text-sm text-purple-600">Interactions</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
