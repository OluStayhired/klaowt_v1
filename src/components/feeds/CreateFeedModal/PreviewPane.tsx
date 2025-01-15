import React from 'react';
import { Eye } from 'lucide-react';

export function PreviewPane() {
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 flex items-center space-x-2">
        <Eye className="w-5 h-5 text-gray-500" />
        <h3 className="text-sm font-medium text-gray-900">Live Preview</h3>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto">
        <p className="text-sm text-gray-500">
          Feed preview will be displayed here.
        </p>
      </div>
    </div>
  );
}