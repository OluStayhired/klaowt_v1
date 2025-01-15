import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { Post } from '../types/post';

export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { agent, isAuthenticated } = useAuthStore();

  useEffect(() => {
    async function fetchPosts() {
      if (!agent || !isAuthenticated) {
        setError('Please login to view posts');
        setLoading(false);
        return;
      }

      try {
        const timeline = await agent.getTimeline();
        setPosts(timeline.data.feed as Post[]);
      } catch (err) {
        setError('Failed to fetch posts');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, [agent, isAuthenticated]);

  return { posts, loading, error };
}