import React from 'react';
import { Calendar } from 'lucide-react';

interface PeriodSelectorProps {
  period: '7d' | '14d' | '30d';
  onChange: (period: '7d' | '14d' | '30d') => void;
}

export function PeriodSelector({ period, onChange }: PeriodSelectorProps) {
  return (
    <div className="flex items-center space-x-2">
      <Calendar className="w-4 h-4 text-gray-500" />
      <div className="flex bg-gray-100 rounded-lg p-1">
        {(['7d', '14d', '30d'] as const).map((option) => (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
              period === option
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}