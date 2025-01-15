import React from 'react';
import { Loader2, CheckCircle } from 'lucide-react';
import { FeedAlgorithm } from '../types';
import { useFeedValidation } from '../hooks/useFeedValidation';

interface FeedValidationProps {
  settings: FeedAlgorithm;
  onBack: () => void;
  onComplete: () => void;
}

export function FeedValidation({ settings, onBack, onComplete }: FeedValidationProps) {
  const { validation, loading } = useFeedValidation(settings);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-blue-500" />
          <span>Feed Validation</span>
        </h3>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-gray-700">Posts per Day</p>
                <p className="text-2xl font-bold text-gray-900">
                  {validation.metrics.estimatedPostsPerDay}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-gray-700">Unique Authors</p>
                <p className="text-2xl font-bold text-gray-900">
                  {validation.metrics.uniqueAuthors}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-gray-700">Engagement Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(validation.metrics.engagementRate * 100).toFixed(1)}%
                </p>
              </div>
            </div>

            {validation.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <ul className="list-disc list-inside space-y-1">
                  {validation.errors.map((error, index) => (
                    <li key={index} className="text-sm text-red-600">{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex space-x-4">
        <button
          onClick={onBack}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          onClick={onComplete}
          disabled={loading || !validation.isValid}
          className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300 transition-colors"
        >
          Continue to Preview
        </button>
      </div>
    </div>
  );
}