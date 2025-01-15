import React from 'react';
import { CreateFeedWorkflow } from './create/CreateFeedWorkflow';
import { Feed } from '../../types/feed';

const debugLog = (message: string, data?: any) => {
  console.log(`[Create Feed Component] ${message}`, data ? JSON.stringify(data, null, 2) : '');
};

interface CreateFeedComponentProps {
  onBack: (newFeed?: Feed) => void;
}

export function CreateFeedComponent({ onBack }: CreateFeedComponentProps) {
  const handleWorkflowComplete = (newFeed?: Feed) => {
    debugLog('Workflow complete', { newFeed });
    onBack(newFeed);
  };

  return <CreateFeedWorkflow onBack={handleWorkflowComplete} />;
}