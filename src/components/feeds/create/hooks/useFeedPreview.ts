import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../../auth';
import { FeedAlgorithm } from '../types';
import { Post } from '../../../../types/post';

const debugLog = (message: string, data?: any) => {
  console.log(`[Feed Preview] ${message}`, data ? JSON.stringify(data, null, 2) : '');
};

export function useFeedPreview(algorithm: FeedAlgorithm) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { agent } = useAuthStore();

  useEffect(() => {
    let mounted = true;

    async function fetchPreviewPosts() {
      if (!agent || !algorithm || Object.keys(algorithm).length === 0) return;

      try {
        setLoading(true);
        setError(null);

        debugLog('Fetching preview posts with algorithm', algorithm);

        const response = await agent.getTimeline({
          limit: 50,
        });

        if (!mounted) return;

        const filteredPosts = response.data.feed
          .filter(item => {
            if (!item?.post) return false;
            
            const { interactionThresholds } = algorithm;
            if (!interactionThresholds) return true;

            const likeCount = item.post.likeCount || 0;
            const repostCount = item.post.repostCount || 0;
            const replyCount = item.post.replyCount || 0;

            return (
              (!interactionThresholds.minLikes || likeCount >= interactionThresholds.minLikes) &&
              (!interactionThresholds.minReposts || repostCount >= interactionThresholds.minReposts) &&
              (!interactionThresholds.minReplies || replyCount >= interactionThresholds.minReplies)
            );
          })
          .map(item => ({
            uri: item.post.uri,
            cid: item.post.cid,
            author: item.post.author,
            record: item.post.record,
            replyCount: item.post.replyCount || 0,
            repostCount: item.post.repostCount || 0,
            likeCount: item.post.likeCount || 0,
            indexedAt: item.post.indexedAt,
          }));

        if (mounted) {
          setPosts(filteredPosts.slice(0, 25));
          setError(null);
        }
      } catch (err: any) {
        console.error('Error fetching preview posts:', err);
        if (mounted) {
          setError('Failed to load preview posts. Please try again.');
          setPosts([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchPreviewPosts();

    return () => {
      mounted = false;
    };
  }, [agent, algorithm]);

  return { posts, loading, error };
}