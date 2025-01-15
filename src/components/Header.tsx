import React from 'react';
import { AtSign } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AtSign className="w-8 h-8 text-blue-500" />
            <h1 className="text-xl font-bold text-gray-900">BlueSky Feed</h1>
          </div>
          <nav className="flex space-x-4">
            <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-500 transition-colors">
              Timeline
            </button>
            <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-500 transition-colors">
              Following
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}