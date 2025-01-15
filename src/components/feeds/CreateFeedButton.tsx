import React from 'react';
import { PlusSquare } from 'lucide-react';

interface CreateFeedButtonProps {
  onClick: () => void;
}

export function CreateFeedButton({ onClick }: CreateFeedButtonProps) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
    >
      <PlusSquare className="w-4 h-4 mr-2 text-gray-500" />
      <span className="text-sm font-medium">Create Feed</span>
    </button>
  );
}