import React, { useState } from 'react';
import { format, subDays } from 'date-fns';
import { Flame } from 'lucide-react';

interface PostingStreakProps {
  streak: number[];
}

interface DayInfo {
  date: string;
  count: number;
}

export function PostingStreak({ streak }: PostingStreakProps) {
  const [hoveredDay, setHoveredDay] = useState<DayInfo | null>(null);
  
  const last30Days = streak.slice(-30);
  const currentStreak = last30Days.reverse().findIndex(count => count === 0);
  const streakCount = currentStreak === -1 ? last30Days.length : currentStreak;

  // Get max posts in a day for color scaling
  const maxPosts = Math.max(...last30Days);

  // Enhanced color palette with more vibrant gradients
  const getCellColor = (count: number) => {
    if (count === 0) return 'bg-gray-50';
    const intensity = Math.min(Math.ceil((count / maxPosts) * 5), 5);
    switch (intensity) {
      case 1: return 'bg-blue-100';
      case 2: return 'bg-blue-200';
      case 3: return 'bg-blue-300';
      case 4: return 'bg-blue-400';
      case 5: return 'bg-blue-500';
      default: return 'bg-gray-50';
    }
  };

  const gridData = last30Days.map((count, index) => {
    const date = subDays(new Date(), 29 - index);
    return { date, count };
  });

  // Create a 5x6 grid layout
  const rows = Array.from({ length: 5 }, (_, rowIndex) => 
    gridData.slice(rowIndex * 6, (rowIndex + 1) * 6)
  );

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center text-xs text-gray-500">
          <Flame className="w-3 h-3 text-orange-500 mr-1" />
          {streakCount} {streakCount === 1 ? 'day' : 'days'} streak
        </div>
      </div>
      <div className="grid grid-rows-5 gap-0">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-6 gap-0">
            {row.map((day, dayIndex) => (
              <div
                key={dayIndex}
                className={`aspect-square ${getCellColor(day.count)} relative w-4 transition-colors duration-200`}
                onMouseEnter={() => setHoveredDay({
                  date: format(day.date, 'MMM d, yyyy'),
                  count: day.count
                })}
                onMouseLeave={() => setHoveredDay(null)}
              >
                {hoveredDay && format(day.date, 'MMM d, yyyy') === hoveredDay.date && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-10">
                    <div className="bg-gray-900 text-white text-[10px] rounded-md px-1.5 py-0.5 whitespace-nowrap shadow-lg backdrop-blur-sm bg-opacity-90">
                      {hoveredDay.count} {hoveredDay.count === 1 ? 'post' : 'posts'} on {hoveredDay.date}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}