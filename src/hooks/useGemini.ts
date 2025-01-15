import { useState } from 'react';
import { generateContent, improveComment, turnCommentToPost, generatePostIdeas, GeminiResponse } from '../lib/gemini';

interface UseGeminiReturn {
  loading: boolean;
  error: string | null;
  generateContent: (prompt: string) => Promise<GeminiResponse>;
  improveComment: (comment: string) => Promise<GeminiResponse>;
  turnCommentToPost: (comment: string) => Promise<GeminiResponse>;
  generatePostIdeas: (topic: string, count?: number) => Promise<GeminiResponse>;
}

export function useGemini(): UseGeminiReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGeminiRequest = async <T extends (...args: any[]) => Promise<GeminiResponse>>(
    fn: T,
    ...args: Parameters<T>
  ): Promise<GeminiResponse> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fn(...args);
      if (response.error) {
        setError(response.error);
      }
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      return { text: '', error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    generateContent: (prompt: string) => handleGeminiRequest(generateContent, prompt),
turnCommentToPost: (comment: string) => handleGeminiRequest(turnCommentToPost, comment),
    improveComment: (comment: string) => handleGeminiRequest(improveComment, comment),
    generatePostIdeas: (topic: string, count?: number) => handleGeminiRequest(generatePostIdeas, topic, count),
  };
}