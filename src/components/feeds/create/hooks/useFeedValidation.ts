import { useState, useEffect } from 'react';
import { FeedAlgorithm, ValidationResult } from '../types';
import { useAuthStore } from '../../../../auth';

const debugLog = (message: string, data?: any) => {
  console.log(`[Feed Validation] ${message}`, data ? JSON.stringify(data, null, 2) : '');
};

export function useFeedValidation(algorithm: FeedAlgorithm) {
  const [validation, setValidation] = useState<ValidationResult>({
    isValid: false,
    errors: [],
    metrics: {
      estimatedPostsPerDay: 0,
      uniqueAuthors: 0,
      engagementRate: 0
    }
  });
  const [loading, setLoading] = useState(false);
  const { agent } = useAuthStore();

  useEffect(() => {
    let mounted = true;

    async function validateAlgorithm() {
      if (!agent || !algorithm || Object.keys(algorithm).length === 0) return;

      try {
        setLoading(true);
        debugLog('Starting algorithm validation', { algorithm });

        const response = await agent.getTimeline({
          limit: 100,
        });

        if (!mounted) return;

        const posts = response.data.feed;
        const uniqueAuthors = new Set(posts.map(item => item.post.author.did)).size;
        const totalEngagement = posts.reduce((sum, item) => 
          sum + (item.post.likeCount || 0) + (item.post.repostCount || 0), 0
        );
        const avgEngagement = totalEngagement / posts.length;

        const metrics = {
          estimatedPostsPerDay: Math.round(posts.length / 7),
          uniqueAuthors,
          engagementRate: avgEngagement / posts.length
        };

        debugLog('Validation metrics calculated', { metrics });

        if (mounted) {
          setValidation({
            isValid: true,
            errors: [],
            metrics
          });
        }
      } catch (err: any) {
        console.error('Validation error:', err);
        if (mounted) {
          setValidation(prev => ({
            ...prev,
            isValid: false,
            errors: ['Failed to validate feed algorithm. Please try again.']
          }));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    validateAlgorithm();

    return () => {
      mounted = false;
    };
  }, [agent, algorithm]);

  return { validation, loading };
}