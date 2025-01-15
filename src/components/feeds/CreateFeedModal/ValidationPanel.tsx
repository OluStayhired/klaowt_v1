import React from 'react';
import { CheckCircle } from 'lucide-react';

export function ValidationPanel() {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <CheckCircle className="w-5 h-5 text-gray-500" />
        <h3 className="text-sm font-medium text-gray-900">Validation</h3>
      </div>
      
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-sm text-gray-500">
          Feed validation metrics will be displayed here.
        </p>
      </div>
    </div>
  );
}