import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { AlgorithmBuilder } from './AlgorithmBuilder';
import { PreviewPane } from './PreviewPane';
import { ValidationPanel } from './ValidationPanel';

interface CreateFeedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateFeedModal({ isOpen, onClose }: CreateFeedModalProps) {
  const [naturalLanguageInput, setNaturalLanguageInput] = useState('');

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Prevent scroll on body and any other scrollable containers
      document.body.style.overflow = 'hidden';
      const mainContent = document.querySelector('main');
      if (mainContent) {
        mainContent.style.overflow = 'hidden';
      }
    } else {
      // Restore scroll
      document.body.style.overflow = 'unset';
      const mainContent = document.querySelector('main');
      if (mainContent) {
        mainContent.style.overflow = 'unset';
      }
    }

    return () => {
      // Cleanup
      document.body.style.overflow = 'unset';
      const mainContent = document.querySelector('main');
      if (mainContent) {
        mainContent.style.overflow = 'unset';
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100000] overflow-hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal Container */}
      <div className="fixed inset-0 flex items-center justify-center">
        {/* Modal Content */}
        <div 
          className="bg-white rounded-xl w-full max-w-6xl h-[80vh] flex flex-col relative mx-4"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Create Custom Feed</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Panel */}
            <div className="w-2/3 p-6 flex flex-col space-y-6 overflow-y-auto">
              {/* Natural Language Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Describe your feed
                </label>
                <textarea
                  value={naturalLanguageInput}
                  onChange={(e) => setNaturalLanguageInput(e.target.value)}
                  placeholder="Describe what content you want in your feed..."
                  className="w-full h-32 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Algorithm Builder */}
              <AlgorithmBuilder description={naturalLanguageInput} />

              {/* Validation Panel */}
              <ValidationPanel />
            </div>

            {/* Right Panel - Preview */}
            <div className="w-1/3 border-l border-gray-200">
              <PreviewPane />
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Cancel
            </button>
            <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-medium">
              Create Feed
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}