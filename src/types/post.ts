import { FeedAlgorithm } from '../components/feeds/create/types';

export interface Post {
  uri: string;
  cid: string;
  author: {
    did: string;
    handle: string;
    displayName?: string;
    avatar?: string;
  };
  record: {
    text: string;
    createdAt: string;
    embed?: {
      $type?: string;
      record?:{
        uri: string;
        cid: string;
        author: {
                did: string;
                handle: string;
                displayName?: string;
                avatar?: string;
                };
        record: {text: string}
      }
      images?: Array<{
        alt?: string;
        image: {
          ref: {
            $link: string;
          };
          mimeType: string;
        };
      }>;
      external?: {
        uri: string;
        title?: string;
        description?: string;
        thumb?: string;
      };
    };
  };
  replyCount: number;
  repostCount: number;
  likeCount: number;
  indexedAt: string;
  isLiked?: boolean;
  replies?: Post[];
  isReply?: boolean;
  parentPost?: Post;
  keywordMatch?: {
    percentage: number;
    matchedWords: string[];
  };
}