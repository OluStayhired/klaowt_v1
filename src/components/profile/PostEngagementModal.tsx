import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Clock, BarChart2, Loader2, Calendar, 
  Sunrise, Sun, Sunset, Moon, Users, Activity,
  TrendingUp, ArrowUp, ChevronDown, ChevronUp,
  MessageCircle, Heart, Share2
} from 'lucide-react';
import { useAuthStore } from '../../auth';
import { Line } from 'react-chartjs-2';
import { format, subDays, startOfDay, parseISO } from 'date-fns';
import { useFollowerGrowth } from '../../hooks/useFollowerGrowth';
import { formatNumber } from '../../utils/formatters';

interface PostEngagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PostEngagementModal({ isOpen, onClose }: PostEngagementModalProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('7d');
  const { user } = useAuthStore();
  const { data: growthData, loading: growthLoading, error: growthError } = useFollowerGrowth(user?.did || '', timeRange);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);

  const timeRangeOptions = [
    { value: '7d', label: '7d' },
    { value: '30d', label: '30d' },
    { value: '90d', label: '90d' },
    { value: 'all', label: 'All' }
  ];

  // Filter Data Function
    const filterDataByTimeRange = (data) => {
        if (!data) return [];
        const now = new Date();
        let filterDate;

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

        return data.filter(d => parseISO(d.timestamp) >= filterDate);
    };

  const filteredData = useMemo(() => {
        return filterDataByTimeRange(growthData?.followers);
    }, [growthData?.followers, timeRange]);

    const chartData = useMemo(() => ({
        labels: filteredData.map(d => format(new Date(d.timestamp), 'MMM d')),
        datasets: [{
            label: 'Engagement',
            data: filteredData.map(d => d.engagement),
            fill: true,
            borderColor: 'rgb(33, 150, 243)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            yAxisID: 'engagement'
        }]
    }), [filteredData]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        bottom: 20
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
                            wrappedText.forEach(line => lines.push(line)); 
                            }
                    }

                    return lines; // Return the array
                },
                // Removed footer callback
            }
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

  
  if (!isOpen) return null;

  const modal = (
    <div className="fixed inset-0 z-[9999] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-400">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl w-full max-w-4xl shadow-2xl" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center space-x-3">
              <BarChart2 className="w-6 h-6 text-blue-500" />
              <h2 className="text-xl font-semibold">Post Engagement Analysis</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-400">
            {growthLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            ) : growthError ? (
              <div className="text-center text-red-500 py-8">
                {growthError}
              </div>
            ) : (
              <>
                {/* Engagement Overview */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
                    <div className="flex items-center justify-between">
                      <Activity className="w-5 h-5 opacity-80" />
                      <span className="text-xs font-medium">Overall</span>
                    </div>
                    <p className="text-2xl font-bold mt-2">
                      {growthData?.metrics.engagementRate.toFixed(1)}%
                    </p>
                    <p className="text-sm opacity-80">Engagement Rate</p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
                    <div className="flex items-center justify-between">
                      <MessageCircle className="w-5 h-5 opacity-80" />
                      <span className="text-xs font-medium">Interactions</span>
                    </div>
                    <p className="text-2xl font-bold mt-2">
                      {formatNumber(growthData?.metrics.totalFollowers || 0)}
                    </p>
                    <p className="text-sm opacity-80">Total Interactions</p>
                  </div>

                  <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
                    <div className="flex items-center justify-between">
                      <TrendingUp className="w-5 h-5 opacity-80" />
                      <span className="text-xs font-medium">Growth</span>
                    </div>
                    <p className="text-2xl font-bold mt-2">
                      {growthData?.metrics.growthRate.toFixed(1)}%
                    </p>
                    <p className="text-sm opacity-80">Growth Rate</p>
                  </div>
                </div>

                {/* Time Range Selector */}
                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    {timeRangeOptions.map(option => (
                      <button
                        key={option.value}
                        onClick={() => setTimeRange(option.value)}
                        className={`px-3 py-1 text-sm rounded-full transition-colors ${
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

                {/* Engagement Chart */}
                <div className="bg-white rounded-xl p-6 border h-[300px]">
                  <Line data={chartData} options={chartOptions} />
                </div>

                {/* Top Performing Posts */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Top Performing Posts</h3>
                  {Object.entries(growthData?.dailyHighestPosts || {})
                    .sort((a, b) => (b[1]?.engagement || 0) - (a[1]?.engagement || 0))
                    .slice(0, 5)
                    .map(([date, post]) => post && (
                      <div key={date} className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-all">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-sm font-medium">{date}</span>
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full text-xs">
                                {post.engagement.toFixed(1)} engagement
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              {post.text.length > 100 && !expandedPost?.includes(date) 
                                ? `${post.text.slice(0, 100)}...` 
                                : post.text}
                            </p>
                            {post.text.length > 100 && (
                              <button
                                onClick={() => setExpandedPost(
                                  expandedPost?.includes(date) ? null : date
                                )}
                                className="text-blue-500 text-sm mt-2 flex items-center"
                              >
                                {expandedPost?.includes(date) ? (
                                  <>Show less <ChevronUp className="w-4 h-4 ml-1" /></>
                                ) : (
                                  <>Show more <ChevronDown className="w-4 h-4 ml-1" /></>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                  ))}
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
