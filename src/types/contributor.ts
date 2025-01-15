export interface ContributorStats {
  did: string;
  handle: string;
  displayName?: string;
  avatar?: string;
  stats: {
    posts: {
      last24h: number;
      last3d: number;
      last7d: number;
    };
    likes: {
      last24h: number;
      last3d: number;
      last7d: number;
    };
    shares: {
      last24h: number;
      last3d: number;
      last7d: number;
    };
    comments: {
      last24h: number;
      last3d: number;
      last7d: number;
    };
  };
}