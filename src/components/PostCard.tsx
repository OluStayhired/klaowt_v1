import React, { useState, useEffect } from 'react';
import { formatDistanceToNowStrict } from 'date-fns';
import { 
  Heart, MessageCircle, Repeat2, ChevronDown, 
  ChevronUp, UserCheck, UserPlus, Send, ImageUp, ExternalLink, ArrowUpWideNarrow, Loader, X, Clock
} from 'lucide-react';
import { Post } from '../types/post';
import { useAuthStore } from '../auth';
import { getPostUrl, openPostUrl } from '../utils/postUrl';
import { formatNumber } from '../utils/formatters';
import { AppBskyRichtextFacet } from '@atproto/api';
import { RichText } from '@atproto/api';

interface PostCardProps {
  post: Post;
  isEngaged?: boolean;
  onReply: (reply: Post) => void;
  onRepost: (repost: Post) => void;
  onUpdatePost: (updates: Partial<Post>) => void;
}

export function PostCard({ post, isEngaged = false, onReply, onUpdatePost }: PostCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [isReply, setIsReply] = useState(post.isReply || false); //isRoot post is a reply
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [isReplying, setIsReplying] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [repostText, setRepostText] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followUri, setFollowUri] = useState<string | null>(null);
  const [showReplies, setShowReplies] = useState(true);
  const [showReposts,setShowReposts] = useState(true);
  const { agent, user } = useAuthStore();
  const [embeddedPost, setEmbeddedPost] = useState<any>(null);
  const [embeddedRootPost, setEmbeddedRootPost] = useState<any>(null);
  const [isLoadingEmbedded, setIsLoadingEmbedded] = useState(false);
  // Add after existing state declarations
const [hoveredThread, setHoveredThread] = useState<Post | null>(null);
const [isThreadFrozen, setIsThreadFrozen] = useState(false);
const [rootPost, setRootPost] = useState<Post | null>(null);
const [loadingRoot, setLoadingRoot] = useState(false);
const [rootReplyText, setRootReplyText] = useState('');
const [linkPreviews, setLinkPreviews] = useState<React.ReactNode[]>([]);
// Add at the top with other state variables
const [isRootReplying, setIsRootReplying] = useState(false);
const [replyCount, setReplyCount] = useState(post.replyCount);  


const [isFollowingRootAuthor, setIsFollowingRootAuthor] = useState(false);
const [rootFollowUri, setRootFollowUri] = useState<string | null>(null);
const [localReplies, setLocalReplies] = useState(post.replies || []);

// At component level, outside both functions
const urlRegex = /(https?:\/\/[^\s]+)/g;

// Utility function for creating facets
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

//max length for replies  
const MAX_CHARS = 300;

// Add URL converter here
// Add this function near the top of PostCard component::
const convertUrlsToLinks = (text: string) => {
  const urlPattern = /(https?:\/\/[^\s]+)/g;
  const sanitizedText = text.replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char] || char);
  
  return sanitizedText.replace(urlPattern, url => 
    `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">${url}</a>`
  );
};

  
  
  const formattedTime = formatDistanceToNowStrict(new Date(post.indexedAt))
    .replace(' seconds', 's')
    .replace(' minutes', 'm')
    .replace(' hours', 'h')
    .replace(' days', 'd')
    .replace(' weeks', 'w')
    .replace(' months', 'mo')
    .replace(' years', 'y');
  
  const formatTime = (time: string) => {
    const now = new Date();
    const postDate = new Date(time);
    const diffInDays = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60 * 60 * 24));
    const diffInHours = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60 * 60));
    return diffInHours >= 24 ? `${diffInDays}d` : `${diffInHours}h`;
  };

  const truncatedText = post.record.text.slice(0, 120);
  const shouldTruncate = post.record.text.length > 120;

useEffect(() => {
  async function fetchEmbeddedPost() {
    if (post?.record?.embed?.record?.uri && post?.record?.embed?.$type === 'app.bsky.embed.record') {
      setIsLoadingEmbedded(true);
      try {
        // Extract the record URI from the embed
        const recordUri = post.record.embed.record.uri;
        
        // Ensure we have a valid AT URI format
        if (!recordUri.startsWith('at://')) {
          throw new Error('Invalid record URI format');
        }

        const response = await agent?.getPostThread({
          uri: recordUri,
          depth: 0, // We only want the specific post, not the thread
        });

        if (response?.data?.thread?.post) {
          setEmbeddedPost(response.data.thread.post);
        }
      } catch (err) {
        console.error('Error fetching embedded post:', err);
      } finally {
        setIsLoadingEmbedded(false);
      }
    }
  }

  fetchEmbeddedPost();
}, [post?.record?.embed?.record?.uri, agent]);

  
  React.useEffect(() => {
    async function checkInteractions() {
      if (!agent) return;
      
      try {
        // Check if the user has liked the post
        const likeResponse = await agent.getLikes({ uri: post.uri });
        const hasLiked = likeResponse.data.likes.some(
          like => like.actor.did === user?.did
        );
        setIsLiked(hasLiked);

        // Check if the user is following the post author
        const profileResponse = await agent.getProfile({
          actor: post.author.did,
        });
        setIsFollowing(!!profileResponse.data.viewer?.following);
        setFollowUri(profileResponse.data.viewer?.following);
      } catch (err) {
        console.error('Error checking interactions:', err);
      }
    }

    checkInteractions();
  }, [agent, post.uri, post.author.did, user?.did]);



// Add new useEffect for root post fetching
  {/*useEffect(() => {
  async function fetchRootPost() {
    if (!agent || !post?.record?.reply?.root?.uri || (!hoveredThread && !isThreadFrozen)) return;
    
    setLoadingRoot(true);
    try {
      // Fetch post thread with depth=1 to include replies
      const [threadResponse, likesRespons, profileResponse] = await Promise.all([
        agent.getPostThread({
          uri: post?.record?.reply?.root?.uri,
          depth: 1  // Changed from 0 to 1 to include replies
        }),
        agent.getLikes({ uri: post?.record?.reply?.root?.uri }),
        agent.getProfile({ // Add this to check follow status
          actor: threadResponse.data.thread.post.author.did,
        })
      ]);

      if (threadResponse?.data?.thread?.post) {
        // Check if the user has liked this post
        const hasLiked = likesResponse.data.likes.some(
          like => like.actor.did === user?.did
        );

        // Get user's replies from the thread
        const userReplies = threadResponse.data.thread.replies?.filter(
          (reply: any) => reply.post.author.did === user?.did
        ).map((reply: any) => ({
          uri: reply.post.uri,
          cid: reply.post.cid,
          author: reply.post.author,
          record: reply.post.record,
          replyCount: reply.post.replyCount || 0,
          repostCount: reply.post.repostCount || 0,
          likeCount: reply.post.likeCount || 0,
          indexedAt: reply.post.indexedAt,
        }));

        // Set root post with like status and replies
        setRootPost({
          ...threadResponse.data.thread.post,
          isLiked: hasLiked,
          replies: userReplies
        });
      }
    // Add follow status check
   setIsFollowingRootAuthor(!!profileResponse.data.viewer?.following);
   setRootFollowUri(profileResponse.data.viewer?.following);

    } catch (err) {
      console.error('Error fetching root post:', err);
    } finally {
      setLoadingRoot(false);
    }
  }

  fetchRootPost();
}, [agent, post?.record?.reply?.root?.uri, hoveredThread, isThreadFrozen, user?.did]);
*/}

  useEffect(() => {
    async function fetchRootPost() {
        if (!agent || !post?.record?.reply?.root?.uri || (!hoveredThread && !isThreadFrozen)) return;

        setLoadingRoot(true);
        try {
            const [threadResponse, likesResponse, profileResponse] = await Promise.all([
                agent.getPostThread({
                    uri: post?.record?.reply?.root?.uri,
                    depth: 1
                }),
                agent.getLikes({ uri: post?.record?.reply?.root?.uri }),
                agent.getProfile({
                    actor: post?.record?.reply?.root?.uri.split('/')[2] // Extract DID
                })
            ]);

            if (threadResponse?.data?.thread?.post) {
                const hasLiked = likesResponse?.data?.likes?.some(like => like.actor.did === user?.did) || false;

                const userReplies = threadResponse.data.thread.replies?.filter(
                    (reply: any) => reply.post.author.did === user?.did
                ).map((reply: any) => ({
                    uri: reply.post.uri,
                    cid: reply.post.cid,
                    author: reply.post.author,
                    record: reply.post.record,
                    replyCount: reply.post.replyCount || 0,
                    repostCount: reply.post.repostCount || 0,
                    likeCount: reply.post.likeCount || 0,
                    indexedAt: reply.post.indexedAt,
                })) || [];

                setRootPost({
                    ...threadResponse.data.thread.post,
                    isLiked: hasLiked,
                    replies: userReplies
                });
            }
          if (profileResponse?.data?.viewer) {
            setIsFollowingRootAuthor(!!profileResponse.data.viewer?.following);
            setRootFollowUri(profileResponse.data.viewer?.following);
          }
        } catch (err) {
            console.error('Error fetching root post:', err);
        } finally {
            setLoadingRoot(false);
        }
    }

    fetchRootPost();
}, [agent, post?.record?.reply?.root?.uri, hoveredThread, isThreadFrozen, user?.did]);

  
// start HandleRootFollow
const handleRootFollow = async () => {
  if (!agent || !rootPost) return;
  
  try {
    if (isFollowingRootAuthor && rootFollowUri) {
      await agent.deleteFollow(rootFollowUri);
      setRootFollowUri(null);
    } else {
      const response = await agent.follow(rootPost.author.did);
      setRootFollowUri(response.uri);
    }
    setIsFollowingRootAuthor(!isFollowingRootAuthor);
  } catch (err) {
    console.error('Error toggling root post follow:', err);
  }
};
// end HandleRootFollow


  const handleLike = async () => {
    if (!agent) return;
    
    // Optimistically update UI
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
      // Revert UI on error
      console.error('Error toggling like:', err);
      setIsLiked(!isLiked);
      setLikeCount(prev => isLiked ? prev + 1 : prev - 1);
      onUpdatePost({ likeCount: isLiked ? likeCount + 1 : likeCount - 1, isLiked });
    }
  };

  const handleRootLike = async () => {
  if (!agent || !rootPost) return;
  
  // Optimistically update UI
  const newRootPost = {
    ...rootPost,
    likeCount: rootPost.isLiked ? rootPost.likeCount - 1 : rootPost.likeCount + 1,
    isLiked: !rootPost.isLiked
  };
  setRootPost(newRootPost);
  
  try {
    if (newRootPost.isLiked) {
      await agent.app.bsky.feed.like.create(
        { repo: agent.session?.did },
        {
          subject: { uri: rootPost.uri, cid: rootPost.cid },
          createdAt: new Date().toISOString(),
        }
      );
    } else {
      await agent.deleteLike(rootPost.uri);
    }
  } catch (err) {
    // Revert UI on error
    console.error('Error toggling root post like:', err);
    setRootPost({
      ...rootPost,
      likeCount: rootPost.isLiked ? rootPost.likeCount + 1 : rootPost.likeCount - 1,
      isLiked: !rootPost.isLiked
    });
  }
};
  
  const handleFollow = async () => {
    if (!agent) return;
    
    try {
      if (isFollowing && followUri) {
        await agent.deleteFollow(followUri);
        setFollowUri(null);
      } else {
        const response = await agent.follow(post.author.did);
        setFollowUri(response.uri);
      }
      setIsFollowing(!isFollowing);
    } catch (err) {
      console.error('Error toggling follow:', err);
    }
  };
// start handle reply
  const handleReply = async () => {
  if (!agent || !replyText.trim() || !user || replyText.length > MAX_CHARS) return;
  
  // Create optimistic reply first
  const optimisticReply = {
    uri: `temp-${Date.now()}`, // Temporary URI
    cid: `temp-${Date.now()}`, // Temporary CID
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
  //onUpdatePost({
   // replyCount: post.replyCount + 1,
   // replies: [...(post.replies || []), optimisticReply]
  //});

  setLocalReplies(prev => [...prev, optimisticReply]);
  setReplyCount(prev => prev + 1);
  setShowReplies(true);   
  
  try {
    // Make API call
    const facets = createUrlFacets(replyText);
    const response = await agent.post({
      text: replyText,
      facets: facets.length > 0 ? facets : undefined,
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

    setLocalReplies(prev => 
      prev.map(reply => 
        reply.uri === optimisticReply.uri ? realReply : reply
      )
    );
    
    
    // Cleanup after successful post
        onReply(realReply);
        setReplyText('');
        setIsReplying(false);

  } catch (err) {
// Revert optimistic update on error
setLocalReplies(prev => 
      prev.filter(reply => reply.uri !== optimisticReply.uri)
    );
setReplyCount(prev => prev - 1);
    console.error('Error posting reply:', err);
  }
};

// end handle reply

    
//console.log("Post Card:", post) //identify postcard
        
const handleRootReply = async () => {
  if (!agent || !rootReplyText.trim() || !user || !rootPost || rootReplyText.length > MAX_CHARS) return;
  
  try {
    // Create basic facets for URLs
    const facets = createUrlFacets(rootReplyText);
    
    const response = await agent.post({
      text: rootReplyText,
      facets: facets.length > 0 ? facets : undefined,
      reply: {
        root: { uri: rootPost.uri, cid: rootPost.cid },
        parent: { uri: rootPost.uri, cid: rootPost.cid }
      }
    });

    // Create an immediate reply post object for the root post
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
        text: rootReplyText,
        createdAt: new Date().toISOString(),
      },
      replyCount: 0,
      repostCount: 0,
      likeCount: 0,
      indexedAt: new Date().toISOString(),
    };

    // Update the root post with the new reply
    if (rootPost.replies) {
      setRootPost({
        ...rootPost,
        replyCount: rootPost.replyCount + 1,
        replies: [...rootPost.replies, newReply]
      });
    } else {
      setRootPost({
        ...rootPost,
        replyCount: rootPost.replyCount + 1,
        replies: [newReply]
      });
    }

    // Clear the reply text
    setRootReplyText('');
  } catch (err) {
    console.error('Error posting root reply:', err);
  }
};

  

  const isReplyPost = post.reply;
  const isOwnPost = user?.did === post.author.did;

  return (
    <div className={`bg-white overflow-x-hidden rounded-lg shadow-sm p-3 hover:shadow-md transition-shadow ${isEngaged ? 'border-l-4 border-blue-100' : ''} `}>

      {/*} <div className={`bg-white overflow-x-hidden rounded-lg shadow-sm p-3 hover:shadow-md transition-shadow ${((!isOwnPost) && (isReply)) ? 'border-l-4 border-green-100' : ''}`}>*/}
 
      <div className="flex items-start space-x-2">
        <img
          src={post.author.avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100&h=100&fit=crop'}
          alt={post.author.displayName || post.author.handle}
          className="w-8 h-8 rounded-full object-cover"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-medium text-xs">
                {post.author.displayName}
              </span>
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <span>@{post.author.handle}</span>
                <span>·</span>
                <span>{formattedTime}</span>
              </div>
            </div>
            {!isOwnPost && (
              <button
                onClick={handleFollow}
                className={`flex items-center px-2 py-0.5 rounded-full text-xs ${
                  isFollowing 
                    ? 'bg-gray-100 text-gray-500'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {isFollowing ? (
                  <UserCheck className="w-3 h-3" />
                ) : (
                  <UserPlus className="w-3 h-3" />
                )}
              </button>   
            )}
          </div>
          
          <div className="mt-1">
            <p className="text-xs text-gray-800 whitespace-pre-wrap break-words">
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
{/*<div className="flex-grow relative text-gray-800">*/}
{/*Start the control for Image or Link*/}               
{post.record.embed && post.record.embed?.images && post.record.embed?.images.length > 0 && (
<div className="flex-grow relative text-gray-800 overflow-x-hidden">
   <div className={`grid gap-0.5 ${
      post.record.embed.images.length === 1 ? 'grid-cols-1' :
      post.record.embed.images.length === 2 ? 'grid-cols-2' :
      post.record.embed.images.length === 3 ? 'grid-cols-2' :
      'grid-cols-2'
    }`}>
  {post.record.embed.images.map((image, index) => (
        <div
          key={index}
          className={`${
            // Special handling for 3 images - make last image full width
            post.record.embed.images.length === 3 && index === 2 
              ? 'col-span-2' 
              : ''
          }`}
         >
  <img className="rounded-md w-full h-full object-cover"
src={
`https://cdn.bsky.app/img/feed_thumbnail/plain/${post.author.did}/${image.image?.ref?.asCID.toString()}@jpeg`}
alt={`Post Image ${index + 1}`}
//style={{ maxWidth: '50%', maxHeight: '200px', objectfit: 'cover' }} 
style={{ aspectRatio: post.record.embed.images.length === 1 ? '16/9' :
post.record.embed.images.length === 2 ? '1/1' :
post.record.embed.images.length === 3 && index === 2 ? '2/1' :
post.record.embed.images.length === 4 ? '1/1' : '1/1', objectFit: 'cover' }}
/>
</div>
))}
</div>
</div>
  )}
  {/*checked image ended here and Check Link Starts*/} 
{/*</div>*/}

{/*<div className="flex-grow relative text-gray-800">*/}
{/*Check if embed link exist*/}   
{post?.record?.embed?.external?.thumb?.ref?.asCID && (
  <div className="flex-grow relative text-gray-800">
    <a href={`${post.record.embed.external.uri}`|| "#"}>  
      <img className="rounded-md"
        src={`https://cdn.bsky.app/img/feed_thumbnail/plain/${post.author.did}/${post.record.embed.external.thumb.ref?.asCID.toString()}@jpeg`}
        alt={`${post.record.embed.external.title}`|| "Post Image"} 
        style={{ width: 'auto', height: 'auto', objectFit: 'cover' }}
    />
    </a>
  </div>
)} {/*closing link search*/}

            {/*Start Repost Code Render*/}     
          {post?.record?.embed?.record?.uri && post?.record?.embed?.$type === 'app.bsky.embed.record' && (
  <div className="mt-2 space-y-2">
    {/* Add loading state while fetching repost */}
    {isLoadingEmbedded ? (
      <div className="flex items-center justify-center p-4">
        <Loader className="w-4 h-4 animate-spin text-gray-500" />
      </div>
    ) : embeddedPost && (
      <div className="flex items-start space-x-2 pl-4 border-l-2 border-gray-100">
        <img
          src={embeddedPost.author?.avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100&h=100&fit=crop'}
          alt={embeddedPost.author?.displayName || embeddedPost.author?.handle || "Author"}
          className="w-6 h-6 rounded-full object-cover"
        />
        <div className="flex-1">
          <div className="flex items-center space-x-1">
            <span className="text-xs font-medium">
              {embeddedPost.author?.displayName || embeddedPost.author?.handle || "Unknown Author"}
            </span>
            <span className="text-xs text-gray-500">
              · {formatDistanceToNowStrict(new Date (embeddedPost.indexedAt))}
  
            </span>
          </div>
          {embeddedPost.record?.text && (
            <p className="text-xs text-gray-800 whitespace-pre-wrap break-words mt-1">{embeddedPost.record.text}</p>
          )}
          {/* Handle embedded post images if they exist */}
          {embeddedPost.record?.embed?.images && (
            <div className="mt-2">
              <img
                src={`https://cdn.bsky.app/img/feed_thumbnail/plain/${embeddedPost.author.did}/${embeddedPost.record.embed.images[0].image?.ref?.asCID.toString()}@jpeg`}
                alt="Embedded post image"
                className="rounded-md max-h-32 object-cover"
              />
            </div>
          )}
        </div>
      </div>
    )}
  </div>
)}
{/*End Repost Code here */}          

            
  {/*</div>*/}            
  </div> {/*was already in use*/}

          <div className="flex items-center space-x-6 mt-2 text-gray-500">
            <button 
              className="flex items-center space-x-1 hover:text-blue-500"
              onClick={() => setIsReplying(!isReplying)}
            >
              <MessageCircle className="w-3 h-3" />
              <span className="text-xs">{formatNumber(post.replyCount)}</span>
            </button>
            <button className="flex items-center space-x-1 hover:text-green-500">
              <Repeat2 className="w-3 h-3" />
              <span className="text-xs">{formatNumber(post.repostCount)}</span>
            </button>
            <button 
              className={`flex items-center space-x-1 ${
                isLiked ? 'text-red-500' : 'hover:text-red-500'
              }`}
              onClick={handleLike}
            >
              <Heart className={`w-3 h-3  ${isLiked ? 'fill-current' : ''}`} />
              <span className="text-xs">{formatNumber(likeCount)}</span>
            </button>
            
        {!isOwnPost && post?.record?.reply && (
            <button 
               onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              //openPostUrl(getPostUrl(post));
              setIsThreadFrozen(!isThreadFrozen);
              if (!isThreadFrozen) {
              setHoveredThread(post);
              } else {
                setHoveredThread(null);
                setRootPost(null);
              }
            }}
              onMouseEnter={() => !isThreadFrozen && setHoveredThread(post)}
              onMouseLeave={() => !isThreadFrozen && setHoveredThread(null)}
                className={`flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-900 hover:bg-blue-600 hover:text-white`}
              >
              <ArrowUpWideNarrow className="w-3 h-3" />
              <span className="text-xs" title="click to comment on original post 🦋">View Original</span>
                
                  
              </button>
            )}

              {!isOwnPost && !post?.record?.reply && (
            <button 
               onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              openPostUrl(getPostUrl(post));
            }}
                className={`flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-900 hover:bg-blue-600 hover:text-white`}
              >
              <ExternalLink className="w-3 h-3" />
              <span className="text-xs" title="view this post on bluesky 🦋">View Post</span>  
                  
              </button>
            )}
            
          {/* View on BlueSky Link */}
        {/*console.log("Current Post:", post)} ;*/}
        

            
            {/*<a 
            href="#"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              openPostUrl(getPostUrl(post));
            }}
            className="text-xs text-blue-500 hover:underline mt-1 inline-block"
          >
            View on BlueSky
          </a>*/}
           
          </div>      
          {/* Replies Section */}
          {/*{post.replies && post.replies.length > 0 && (*/}
          {localReplies.length > 0 && (
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
                  {localReplies.map((reply) => (
                    <div key={reply.uri} className="flex items-start space-x-2 pl-4 border-l-2 border-gray-100">
                      <img
                        src={reply.author.avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100&h=100&fit=crop'}
                        alt={reply.author.displayName || reply.author.handle}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      <div>
                        <div className="flex items-center space-x-1">
                          <span className="text-xs font-medium">{reply.author.displayName || reply.author.handle}</span>
                          <span className="text-xs text-gray-500">· {formatDistanceToNowStrict(new Date(reply.indexedAt))}</span>
                        </div>
                        <p className="text-xs text-gray-800  whitespace-pre-wrap break-words">{reply.record.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Reply Form */}
          {isReplying && (
            <div className="mt-2 border-t pt-2">
              <div className="flex space-x-2">
                <img
                  src={user?.avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100&h=100&fit=crop'}
                  alt={user?.handle}
                  className="w-6 h-6 rounded-full object-cover"
                />
                <div className="flex-1">
                  <textarea
                    value={replyText}
                    onChange={(e) => {
                    setReplyText(e.target.value);
                   // Auto-detect URLs as user types
                  const detectedUrls = e.target.value.match(/(https?:\/\/[^\s]+)/g);
//Start if detect URL

if (detectedUrls) {
  detectedUrls.forEach(url => {
    const linkElement = (
      <div key={`${url}-${Date.now()}-${Math.random()}`} className="mt-2 text-xs">
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-blue-500 hover:underline"
        >
          {url}
        </a>
      </div>
    );
    //setLinkPreviews(prev => [...new Set([...prev, linkElement])]);
  });
}                    
//End  if detect URL                      

    }}
                    placeholder="Write your reply...✍️"
                    className="w-full px-2 py-4 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    rows={8}
                  />
                  {/*Render Previews below textArea*/}
{linkPreviews.length > 0 && (
  <div className="mt-2 space-y-2">
    {linkPreviews}
  </div>
)}

                  
                  {/* Add character counter */}
            <div className={`text-right text-xs mt-1 ${
    replyText.length > MAX_CHARS ? 'text-red-500' : 'text-gray-500'
  }`}>
    {MAX_CHARS - replyText.length} characters remaining
  </div>
                  <div className="flex justify-end mt-1 space-x-2">
                    <button
                      onClick={() => setIsReplying(false)}
                      className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleReply}
                      disabled={!replyText.trim()  || replyText.length > MAX_CHARS}
                      className="flex items-center space-x-1 px-2 py-1 bg-blue-500 text-white rounded-full text-xs hover:bg-blue-600 disabled:bg-blue-300"
                    >
                      <Send className="w-3 h-3" />
                      <span>Reply</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* </div> - newly added to cope with other posts*/}
      {/*Start - Adding the hovering thread before closing PostCard*/}
     
      {/*console.log("Current Post:", isThreadFrozen ? rootPost : hoveredThread)*/}
      {/*console.log("hoveredThread Post:", hoveredThread)*/}
      {/*console.log("Root Post:", rootPost)*/}
      
{(isThreadFrozen ? rootPost : hoveredThread) && post?.record?.reply?.root?.uri && (
  <div 
    className="fixed z-100 bg-white rounded-lg shadow-xl p-4 border border-gray-200"
    style={{ 
      top: '50%',
      right: '25rem',
      transform: 'translateY(-50%)',
      width: '400px'
    }}
  >
    <div className="flex justify-between mb-2">
      <div className="flex items-center">
        <span className="p-1 text-xs text-green-500 bg-green-50 rounded-full">Original Post</span> 
      </div>
      <div className="flex items-center space-x-2"> {/* Add flex container for buttons */}
    
    {/*Start - Follow/UnFollow Logic*/}
    {!isOwnPost && rootPost && (
      <button
        onClick={handleRootFollow}
        className={`flex items-center px-2 py-0.5 rounded-full text-xs ${
          isFollowingRootAuthor 
            ? 'bg-gray-100 text-gray-500'
            : 'bg-blue-500 text-white hover:bg-blue-600'
        }`}
      >
        {isFollowingRootAuthor ? (
          <UserCheck className="w-3 h-3" />
        ) : (
          <UserPlus className="w-3 h-3" />
        )}
      </button>
    )}
  {/*End - Follow/UnFollow Logic*/}

        
      <button 
        onClick={() => {
          setIsThreadFrozen(false);
          setHoveredThread(null);
          setRootPost(null);
        }}
        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
      >
        <X className="w-4 h-4 text-gray-500" />
      </button>
    </div>
    </div>
    
    {loadingRoot ? (
      <div className="flex justify-center items-center p-4">
        <Loader className="w-6 h-6 text-blue-500 animate-spin" />
      </div>
    ) : rootPost && (
      <div className="flex items-start space-x-3">
        <img
          src={rootPost.author.avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100&h=100&fit=crop'}
          alt={rootPost.author.displayName || rootPost.author.handle}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="flex-1">
          <p className="font-medium">
            {rootPost.author.displayName || rootPost.author.handle}
          </p>
          <p className="text-sm text-gray-500">@{rootPost.author.handle}</p>
          
        
<div className="flex-1">
  <p className="text-xs text-gray-800 whitespace-pre-wrap break-words mt-2">{rootPost.record.text}</p>

  
          {/*Start - Handle Root Post Images */}
    {rootPost.record.embed?.images && (
      <div className={`mt-2 grid gap-0.5 ${
        rootPost.record.embed.images.length === 1 ? 'grid-cols-1' :
        rootPost.record.embed.images.length === 2 ? 'grid-cols-2' :
        rootPost.record.embed.images.length === 3 ? 'grid-cols-2' :
        'grid-cols-2'
      }`}>
        {rootPost.record.embed.images.map((image, index) => (
          <div
            key={index}
            className={`${
              rootPost.record.embed.images.length === 3 && index === 2 
                ? 'col-span-2' 
                : ''
            }`}
          >
            <img
              className="rounded-md w-full h-full object-cover"
              src={`https://cdn.bsky.app/img/feed_thumbnail/plain/${rootPost.author.did}/${image.image?.ref?.asCID.toString()}@jpeg`}
              alt={`Post Image ${index + 1}`}
              style={{
                aspectRatio: rootPost.record.embed.images.length === 1 ? '16/9' :
                           rootPost.record.embed.images.length === 2 ? '1/1' :
                           rootPost.record.embed.images.length === 3 && index === 2 ? '2/1' :
                           '1/1'
              }}
            />
          </div>
        ))}
      </div>
    )} 
  {/*End - Handle Root Post Images*/}
{/* Start - Handle Root Post External Links */}
    {rootPost.record.embed?.external?.thumb?.ref && (
      <div className="mt-2">
        <a 
          href={rootPost.record.embed.external.uri}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-md overflow-hidden hover:opacity-90 transition-opacity"
        >
          <img
            className="w-full h-32 object-cover rounded-md"
            src={`https://cdn.bsky.app/img/feed_thumbnail/plain/${rootPost.author.did}/${rootPost.record.embed.external.thumb.ref?.asCID.toString()}@jpeg`}
            alt={rootPost.record.embed.external.title || "External content"}
          />
          {rootPost.record.embed.external.title && (
            <p className="text-xs text-gray-700 mt-1">
              {rootPost.record.embed.external.title}
            </p>
          )}
        </a>
      </div>
    )}
{/*End - Handle RootPost External Links*/}
{/* Start - Handle Root Post Quoted Posts */}
    {rootPost?.record?.embed?.record?.uri && rootPost?.record?.embed?.$type === 'app.bsky.embed.record' && (
      <div className="mt-2 border-l-2 border-gray-100 pl-4">
        <div className="flex items-start space-x-2">
          <img
            src={rootPost?.author?.avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100&h=100&fit=crop'}
            //src={rootPost?.record?.embed?.record?.author?.avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100&h=100&fit=crop'}
            alt={rootPost?.record?.embed?.record?.author?.displayName || rootPost?.record?.embed?.record?.author?.handle}
            className="w-6 h-6 rounded-full object-cover"
          />
          <div>
            <div className="flex items-center space-x-1">
              <span className="text-xs font-medium">
                {rootPost?.record?.embed?.record?.author?.displayName || rootPost?.record?.embed?.record?.author?.handle}
              </span>
              <span className="text-xs text-gray-500">
                · {formatTime(rootPost.record.embed.record.indexedAt)}
              </span>
            </div>
            <p className="text-xs text-gray-800 mt-1">
              {rootPost?.record?.embed?.record?.text}
            </p>
          </div>
        </div>
      </div>
            )}
{/*End - Handle Root Post Quoted Posts part 1*/}
  </div>
          
           
          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
           
            <span className="flex items-center space-x-1">
              <MessageCircle className="w-4 h-4" />
              <span>{formatNumber(rootPost.replyCount)}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Repeat2 className="w-4 h-4" />
              <span>{formatNumber(rootPost.repostCount)}</span>
            </span>
             <span className="flex items-center space-x-1">
  <Heart 
    className={`w-4 h-4 cursor-pointer ${rootPost.isLiked ? 'fill-current text-red-500' : ''}`}
    onClick={handleRootLike}
  />
  <span>{formatNumber(rootPost.likeCount)}</span>
</span>
            <span className="flex items-center space-x-1">
              <Clock className="w-4 h-4 text-gray-400" />
              <span>{formatTime(rootPost.indexedAt)}</span>
            </span>
            <span>
             <button 
               onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              openPostUrl(getPostUrl(post));
            }}
                className={`flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-900 hover:bg-blue-600 hover:text-white`}
              >
              <ExternalLink className="w-3 h-3" />
              <span className="text-xs" title="view this post on bluesky 🦋">View Post</span>  
                  
              </button>
              </span>
          </div>
{/*Start Show Replies*/}   

{rootPost?.replies && rootPost.replies.length > 0 && (
  <div className="mt-4 space-y-2 border-t border-gray-100 pt-2">
    <p className="text-xs text-gray-500">Your previous replies:</p>
    {rootPost.replies.map((reply) => (
      <div key={reply.uri} className="flex items-start space-x-2 pl-4 border-l-2 border-gray-100">
        <img
          src={reply.author.avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100&h=100&fit=crop'}
          alt={reply.author.displayName || reply.author.handle}
          className="w-6 h-6 rounded-full object-cover"
        />
        <div>
          <div className="flex items-center space-x-1">
            <span className="text-xs font-medium">{reply.author.displayName || reply.author.handle}</span>
            <span className="text-xs text-gray-500">· {formatTime(reply.indexedAt)}</span>
          </div>
          <p className="text-xs text-gray-800">{reply.record.text}</p>
        </div>
      </div>
    ))}
  </div>
)}
{/*End Show Replies*/}


          
{/* Start Reply Form */}
<div className="mt-2 border-t pt-2">
  {/*Start - Add rootpost reply button*/}
  <button
    onClick={() => setIsRootReplying(!isRootReplying)}
    className="px-1 text-xs bg-blue-50 text-blue-500 rounded-full hover:text-blue-600 mt-2"
  >
    {isRootReplying ? 'Click to Close' : 'Click to Reply'}
  </button>
  {/*End - Add rootpost reply button*/}
  {/* Wrap the reply form in conditional rendering */}
  {isRootReplying && (
  <div className="flex space-x-2 mt-2">
    <img
      src={user?.avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100&h=100&fit=crop'}
      alt={user?.handle}
      className="w-6 h-6 rounded-full object-cover"
    />
    <div className="flex-1">
      <textarea
        value={rootReplyText}
        onChange={(e) => setRootReplyText(e.target.value)}
        placeholder="Write your reply...✍️"
        className="w-full px-2 py-4 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
        rows={6}
      />
       {/* Add character counter */}
  <div className={`text-right text-xs mt-1 ${
    rootReplyText.length > MAX_CHARS ? 'text-red-500' : 'text-gray-500'
  }`}>
    {MAX_CHARS - rootReplyText.length} characters remaining
  </div>
      <div className="flex justify-end mt-1 space-x-2">
        <button
          onClick={() => setIsReplying(false)}
          className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
        >
          Cancel
        </button>
        <button
          onClick={() => {
              handleRootReply();
              setRootReplyText(''); // Clear root reply text after sending
          }}
          disabled={!rootReplyText.trim() || rootReplyText.length > MAX_CHARS}
          className="flex items-center space-x-1 px-2 py-1 bg-blue-500 text-white rounded-full text-xs hover:bg-blue-600 disabled:bg-blue-300"
        >
          <Send className="w-3 h-3" />
          <span>Reply</span>
        </button>
      </div>
    </div>
  </div>
  )}
</div>
        {/*end reply*/}
        </div>
        {/*add reply form here*/}
      </div>
    )}
  </div>
)}
    {/*End - Adding the hovering thread before closing PostCard*/}
    </div>
  );
}