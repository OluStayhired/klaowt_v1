import { Post } from '../../../types/post';

export interface FeedAlgorithm {
  name?: string;
  description?: string;
  authorFilters?: string[];
  timeRange?: {
    start: Date;
    end: Date;
  };
  interactionThresholds?: {
    minLikes?: number;
    minReposts?: number;
    minReplies?: number;
  };
  contentTypes?: ('text' | 'image' | 'link')[];
  keywords?: string[];
}

export interface KeywordMatch {
  percentage: number;
  matchedWords: string[];
}

export interface PostWithMatch extends Post {
  keywordMatch: KeywordMatch;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  metrics: {
    estimatedPostsPerDay: number;
    uniqueAuthors: number;
    engagementRate: number;
  };
}