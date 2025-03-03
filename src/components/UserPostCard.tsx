import React, { useState, useEffect } from 'react';
import { formatDistanceToNowStrict } from 'date-fns';
import { 
  Heart, MessageCircle, Repeat2, ChevronDown, 
  ChevronUp, Send, ExternalLink, Clock
} from 'lucide-react';
import { Post } from '../types/post';
import { useAuthStore } from '../auth';
import { getPostUrl, openPostUrl } from '../utils/postUrl';
import { formatNumber } from '../utils/formatters';

interface UserPostCardProps {
  post: Post;
  isEngaged?: boolean;
  onReply: (reply: Post) => void;
  onUpdatePost: (updates: Partial<Post>) => void;
  handleInteractionChange: (postUri: string, updates: {
        isLiked: boolean;
        isCommented: boolean;
        isReposted: boolean;
        likeCount: number;
        replyCount: number;
        repostCount: number;
    }) => void;
}

export function UserPostCard({ post, isEngaged = false, onReply, onUpdatePost, handleInteractionChange  }: UserPostCardProps) {
  const [isExpanded, setIsExpanded] = useState(true); //expand all posts by default
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [isReplying, setIsReplying] = useState(true);
  const [replyText, setReplyText] = useState('');
  const { agent, user } = useAuthStore();
  const [showReplies, setShowReplies] = useState(true);
  const [localPost, setLocalPost] = useState(post);
  
  const MAX_CHARS = 300;
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  const createUrlFacets = (text: string) => {
    const urls = text.match(urlRegex) || [];
    return urls.map(url => ({
      index: {
        byteStart: text.indexOf(url),
        byteEnd: text.indexOf(url) + url.length
      },
      features: [{
        $type: "app.bsky.richtext.facet#link",
        uri: url
      }]
    }));
  };

  const formattedTime = formatDistanceToNowStrict(new Date(post.indexedAt))
    .replace(' seconds', 's')
    .replace(' minutes', 'm')
    .replace(' hours', 'h')
    .replace(' days', 'd')
    .replace(' weeks', 'w')
    .replace(' months', 'mo')
    .replace(' years', 'y');

  const truncatedText = post.record.text.slice(0, 120);
  const shouldTruncate = post.record.text.length > 120;

  const toggleLike = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!agent || !user) return;
        try {
            const isLiked = !localPost.isLiked;
            onUpdatePost({
                isLiked: isLiked,
                isCommented: localPost.replies && localPost.replies.length > 0,
                isReposted: localPost.repostCount > 0,
                likeCount: localPost.likeCount + (isLiked ? 1 : -1),
                replyCount: localPost.replyCount,
                repostCount: localPost.repostCount
            });
            setLocalPost(prev => ({ ...prev, isLiked: isLiked, likeCount: prev.likeCount + (isLiked ? 1 : -1) }));
            if (isLiked) {
                await agent.like(post.uri, post.cid);
            } else {
                const likeRecord = (await agent.getLikes({ uri: post.uri })).data.likes.find(like => like.actor.did === user.did);
                if (likeRecord) {
                    await agent.deleteLike(agent.session?.did, likeRecord.uri);
                }
            }
           handleInteractionChange(post.uri, {
              isLiked: !localPost.isLiked,
              isCommented: localPost.replies && localPost.replies.length > 0,
              isReposted: localPost.repostCount > 0,
              likeCount: localPost.likeCount + (!localPost.isLiked ? 1 : -1),
              replyCount: localPost.replyCount,
              repostCount: localPost.repostCount
        });

          
        } catch (err) {
            console.error('Error toggling like:', err);
        }
    };

  const toggleReply = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!agent || !user) return;
    
    try {
        // Determine new comment state
        const isCommented = !localPost.isCommented;
        
        // Optimistically update UI
        onUpdatePost({
            isLiked: localPost.isLiked,
            isCommented: isCommented,
            isReposted: localPost.isReposted,
            likeCount: localPost.likeCount,
            replyCount: localPost.replyCount + (isCommented ? 1 : -1),
            repostCount: localPost.repostCount
        });

        // Update local state
        setLocalPost(prev => ({
            ...prev,
            isCommented: isCommented,
            replyCount: prev.replyCount + (isCommented ? 1 : -1)
        }));

        if (isCommented) {
            // Add comment logic
            await agent.post({
                text: replyText,
                reply: {
                    root: { uri: post.uri, cid: post.cid },
                    parent: { uri: post.uri, cid: post.cid }
                }
            });
        } else {
            // Remove comment logic
            const threadResponse = await agent.getPostThread({ uri: post.uri });
            const userComment = threadResponse.data.thread.replies?.find(
                reply => reply.post.author.did === user.did
            );
            
            if (userComment) {
                await agent.deletePost(userComment.post.uri);
            }
        }
    } catch (err) {
        // Revert optimistic updates on error
        console.error('Error toggling comment:', err);
        onUpdatePost({
            isLiked: localPost.isLiked,
            isCommented: !isCommented, // Revert
            isReposted: localPost.isReposted,
            likeCount: localPost.likeCount,
            replyCount: localPost.replyCount - (isCommented ? 1 : -1), // Revert
            repostCount: localPost.repostCount
        });
        setLocalPost(prev => ({
            ...prev,
            isCommented: !isCommented, // Revert
            replyCount: prev.replyCount - (isCommented ? 1 : -1) // Revert
        }));
    }
};


  const toggleRepost = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!agent) return;
        try {
            const isReposted = localPost.repostCount === 0;
            onUpdatePost({
                isLiked: localPost.isLiked,
                isCommented: localPost.replies && localPost.replies.length > 0,
                isReposted: isReposted,
                likeCount: localPost.likeCount,
                replyCount: localPost.replyCount,
                repostCount: localPost.repostCount + (isReposted ? 1 : -1)
            });
            setLocalPost(prev => ({ ...prev, repostCount: prev.repostCount + (isReposted ? 1 : -1) }));
            if (isReposted) {
                await agent.repost(post.uri);
            } else {
              // add logic to remove repost
            }
        } catch (err) {
            console.error('Error toggling repost:', err);
        }
    };

  

  const handleLike = async () => {
    if (!agent) return;
    
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    onUpdatePost({ likeCount: isLiked ? likeCount - 1 : likeCount + 1, isLiked: !isLiked });
    
    try {
      if (isLiked) {
        await agent.deleteLike(post.uri);
      } else {
        await agent.app.bsky.feed.like.create(
          { repo: agent.session?.did },
          {
            subject: { uri: post.uri, cid: post.cid },
            createdAt: new Date().toISOString(),
          }
        );
      }
    } catch (err) {
      console.error('Error toggling like:', err);
      setIsLiked(!isLiked);
      setLikeCount(prev => isLiked ? prev + 1 : prev - 1);
      onUpdatePost({ likeCount: isLiked ? likeCount + 1 : likeCount - 1, isLiked });
    }
  };

const handlePostReply = async () => {
  if (!agent || !replyText.trim() || !user) return;
  
  // Create optimistic reply first
  const optimisticReply: Post = {
    uri: '', // Will be updated with real URI
    cid: '', // Will be updated with real CID
    author: {
      did: user.did,
      handle: user.handle,
      displayName: user.displayName,
      avatar: user.avatar,
    },
    record: {
      text: replyText,
      createdAt: new Date().toISOString(),
    },
    replyCount: 0,
    repostCount: 0,
    likeCount: 0,
    indexedAt: new Date().toISOString(),
  };

  // Update UI immediately
  onUpdatePost({
    replyCount: localPost.replyCount + 1,
    replies: [...(post.replies || []), optimisticReply]
  });

  try {
    // Make API call
    const facets = createUrlFacets(replyText);
    const response = await agent.post({
      text: replyText,
      reply: {
        root: { uri: post.uri, cid: post.cid },
        parent: { uri: post.uri, cid: post.cid }
      }
    });

    // Update with real data
    const realReply = {
      ...optimisticReply,
      uri: response.uri,
      cid: response.cid
    };

    onReply(realReply);
    setReplyText('');
    setIsReplying(false);

  } catch (err) {
    // Revert optimistic update on error
    onUpdatePost({
      replyCount: post.replyCount,
      replies: post.replies || []
    });
    console.error('Error posting reply:', err);
  }
};

  
  const handleReply = async () => {
        if (!agent || !replyText.trim() || !user || replyText.length > MAX_CHARS) return;

        try {
            const facets = createUrlFacets(replyText);
            const response = await agent.post({
                text: replyText,
                facets: facets.length > 0 ? facets : undefined,
                reply: {
                    root: { uri: post.uri, cid: post.cid },
                    parent: { uri: post.uri, cid: post.cid }
                }
            });

            const newReply: Post = {
                uri: response.uri,
                cid: response.cid,
                author: {
                    did: user.did,
                    handle: user.handle,
                    displayName: user.displayName,
                    avatar: user.avatar,
                },
                record: {
                    text: replyText,
                    createdAt: new Date().toISOString(),
                },
                replyCount: 0,
                repostCount: 0,
                likeCount: 0,
                indexedAt: new Date().toISOString(),
            };

            onReply(newReply);

            // Optimistic Update
            const newReplyCount = (localPost.replies ? localPost.replies.length : 0) + 1;

            onUpdatePost({
                isLiked: localPost.isLiked,
                isCommented: true,
                isReposted: localPost.repostCount > 0,
                likeCount: localPost.likeCount,
                replyCount: newReplyCount,
                repostCount: localPost.repostCount
            });

            setLocalPost(prev => ({
                ...prev,
                replies: prev.replies ? [...prev.replies, newReply] : [newReply],
                replyCount: newReplyCount
            }));

            setReplyText('');
            setIsReplying(false);
        } catch (err) {
            console.error('Error posting reply:', err);
        }
    };

  return (
    <div className={`bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow ${
      isEngaged ? 'border-l-4 border-blue-100' : ''
    }`}>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img
              src={post.author.avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100&h=100&fit=crop'}
              alt={post.author.displayName || post.author.handle}
              className="w-8 h-8 rounded-full object-cover"
            />
            <div>
              <p className="text-sm font-medium">{post.author.displayName || post.author.handle}</p>
              <p className="text-xs text-gray-500">@{post.author.handle}</p>
            </div>
          </div>
          <div className="flex items-center space-x-1 text-xs text-gray-400">
            <Clock className="w-3.5 h-3.5" />
            <span>{formattedTime}</span>
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-800 whitespace-pre-wrap">
            {isExpanded ? post.record.text : truncatedText}
            {shouldTruncate && !isExpanded && '...'}
          </p>
          {shouldTruncate && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-blue-500 hover:text-blue-600 text-xs mt-1 flex items-center"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-3 h-3 mr-1" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3 mr-1" />
                  Show more
                </>
              )}
            </button>
          )}
        </div>

        {/* Post Images */}
        {post.record.embed?.images && (
          <div className={`grid gap-2 ${
            post.record.embed.images.length === 1 ? 'grid-cols-1' :
            post.record.embed.images.length === 2 ? 'grid-cols-2' :
            'grid-cols-2'
          }`}>
            {post.record.embed.images.map((image, index) => (
              <div
                key={index}
                className={post.record.embed.images.length === 3 && index === 2 ? 'col-span-2' : ''}
              >
                <img
                  src={`https://cdn.bsky.app/img/feed_thumbnail/plain/${post.author.did}/${image.image?.ref?.asCID.toString()}@jpeg`}
                  alt={`Post Image ${index + 1}`}
                  className="rounded-lg w-full h-full object-cover"
                  style={{
                    aspectRatio: post.record.embed.images.length === 1 ? '16/9' :
                              post.record.embed.images.length === 2 ? '1/1' :
                              post.record.embed.images.length === 3 && index === 2 ? '2/1' :
                              '1/1'
                  }}
                />
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center text-gray-500 justify-between pt-2">
          <div className="flex items-center space-x-6">
            <button 
              className="flex items-center space-x-1 hover:text-blue-500"
              onClick={() => setIsReplying(!isReplying)}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="text-xs">{formatNumber(localPost.replyCount)}</span>
            </button>
            <button className="flex items-center space-x-1 hover:text-green-500"
              onClick={toggleRepost}
              >
              <Repeat2 className="w-3.5 h-3.5" />
              <span className="text-xs">{formatNumber(localPost.repostCount)}</span>
            </button>
            <button 
              className={`flex items-center space-x-1 ${isLiked ? 'text-red-500' : 'hover:text-red-500'}`}
              onClick={toggleLike}
            >
              <Heart className={`w-3.5 h-3.5 ${localPost.isLiked ? 'fill-current text-red-500' : ''}`} />
              <span className="text-xs">{formatNumber(localPost.likeCount)}</span>
            </button>
          </div>
          
          <button 
            onClick={() => openPostUrl(getPostUrl(post))}
            className="flex items-center space-x-1 text-xs text-gray-500 hover:text-blue-500"
          >
            <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
            <span>View on Bluesky</span>
          </button>
        </div>

{/* Replies Section */}
        {/*{post.replies && post.replies.length > 0 && (*/}
        {localPost.replies && localPost.replies.length > 0 && (
            <div className="mt-2">
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="text-xs text-blue-500 hover:text-blue-600 flex items-center"
              >
                {showReplies ? (
                  <>
                    <ChevronUp className="w-3 h-3 mr-1" />
                    Hide Replies
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3 mr-1" />
                    Show Replies
                  </>
                )}
              </button>
              {showReplies && (
                <div className="mt-2 space-y-2">
                  {localPost.replies.map((reply) => (
                    <div key={reply.uri} className="flex items-start space-x-2 pl-4 border-l-2 border-gray-100">
                      <img
                        src={reply.author.avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100&h=100&fit=crop'}
                        alt={reply.author.displayName || reply.author.handle}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      <div>
                        <div className="flex items-center space-x-1">
                          <span className="text-xs font-medium">{reply.author.displayName || reply.author.handle}</span>
                          <span className="text-xs text-gray-300">· {formatDistanceToNowStrict(new Date(reply.indexedAt))}</span>
                        </div>
                        <p className="text-xs text-gray-800  whitespace-pre-wrap break-words">{reply.record.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        {/*end show replies*/} 

        {/* Reply Form */}
        {isReplying && (
          <div className="mt-4 border-t pt-4">
            <div className="flex space-x-2">
              <img
                src={user?.avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100&h=100&fit=crop'}
                alt={user?.handle}
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className="flex-1">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write your reply..."
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={4}
                />
                <div className={`text-right text-xs mt-1 ${
                  replyText.length > MAX_CHARS ? 'text-red-500' : 'text-gray-500'
                }`}>
                  {MAX_CHARS - replyText.length} characters remaining
                </div>
                <div className="flex justify-end mt-2 space-x-2">
                  <button
                    onClick={() => setIsReplying(false)}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReply}
                    disabled={!replyText.trim() || replyText.length > MAX_CHARS}
                    className="flex items-center space-x-1 px-3 py-1 bg-blue-500 text-white rounded-full text-sm hover:bg-blue-600 disabled:bg-blue-300"
                  >
                    <Send className="w-4 h-4" />
                    <span>Reply</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}