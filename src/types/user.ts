export interface User {
  did: string;
  handle: string;
  displayName?: string;
  avatar?: string;
  description?: string;
  followersCount: number;
  followsCount: number;
  postsCount: number;
  isPinned?: boolean;
  followUri?: string | null;
  isFollowing?: boolean;
  isFollowedBy?: boolean;
  category?: 'Following' | 'Followers' | 'Mutuals';
  engagementScore: number; // 0-100 percentage
interactions: {
  likes: number;
  reposts: number; 
  comments: number;
  total: number;
};
myInteractions: {
  liked: boolean;
  reposted: boolean;
  commented: boolean;
};
}
