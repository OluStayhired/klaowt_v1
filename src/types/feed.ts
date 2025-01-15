export interface Feed {
  uri: string;
  cid: string;
  creator: {
    did: string;
    handle: string;
    displayName?: string;
    avatar?: string;
  };
  displayName: string;
  description: string;
  avatar?: string;
  likeCount: number;
  subscriberCount: number;
  category?: string;
  uniqueId?: string; // Add uniqueId field
  algorithm?: any; // For custom feeds
}