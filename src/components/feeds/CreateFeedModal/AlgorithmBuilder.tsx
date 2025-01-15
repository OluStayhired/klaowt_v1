import React from 'react';
import { Settings2 } from 'lucide-react';

interface AlgorithmBuilderProps {
  description: string;
}

export function AlgorithmBuilder({ description }: AlgorithmBuilderProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Settings2 className="w-5 h-5 text-gray-500" />
        <h3 className="text-sm font-medium text-gray-900">Algorithm Settings</h3>
      </div>
      
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-sm text-gray-500">
          Algorithm builder will be implemented here based on the natural language description.
        </p>
      </div>
    </div>
  );
}