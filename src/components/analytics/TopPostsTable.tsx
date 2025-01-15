import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../auth';

import { createPortal } from 'react-dom';
import { X, Clock, Heart, Share2, MessageCircle, ExternalLink, SquarePen } from 'lucide-react';
import { formatNumber } from '../../utils/formatters';
import { Post } from '../../types/post';
import { subDays, parseISO } from 'date-fns';
import { getPostUrl, openPostUrl } from '../../utils/postUrl';

interface TopPostsTableProps {
  posts: Post[];
  onClose: () => void;
}

type TimeRange = 'last24h' | 'last3d' | 'last7d';
type SortColumn = 'content' | 'likes' | 'shares' | 'comments' | 'time';

export function TopPostsTable({ posts, onClose }: TopPostsTableProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('last7d');
  const [sortColumn, setSortColumn] = useState<SortColumn>('likes');
  const [hoveredPost, setHoveredPost] = useState<Post | null>(null);
  const [IsFrozen, setIsFrozen]=useState(false);
  const [isThreadFrozen, setIsThreadFrozen] = useState(false);
  const [frozenPost, setFrozenPost] = useState<Post | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const { agent, user } = useAuthStore();
  const [postInteractions, setPostInteractions] = useState<Map<string, {
  hasLiked: boolean;
  hasReplied: boolean;
}>>(new Map());
//console.log("Show Posts data:", posts); // Log posts here
//console.log("Show hoveredPosts:", hoveredPost); // Log posts here

// Add new state hooks at the top with other states
const [isReplying, setIsReplying] = useState(false);
const [replyText, setReplyText] = useState('');
const MAX_CHARS = 300; // Match PostCard.tsx character limit

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

//Add a handleReply Function
const handleReply = async () => {
  if (!agent || !replyText.trim() || !user || replyText.length > MAX_CHARS) return;
  
  try {
      // Create basic facets for URLs
    const facets = createUrlFacets(replyText);
    const post = IsFrozen ? frozenPost : hoveredPost;
    const response = await agent.post({
      text: replyText,
      facets: facets.length > 0 ? facets : undefined,
      reply: {
        root: { uri: post.uri, cid: post.cid },
        parent: { uri: post.uri, cid: post.cid }
      }
    });

    // Update interactions map to show user has replied
    setPostInteractions(prev => new Map(prev).set(post.uri, {
      ...prev.get(post.uri),
      hasReplied: true
    }));

    setReplyText('');
    setIsReplying(false);
  } catch (err) {
    console.error('Error posting reply:', err);
  }
};

//Start handleLike function
const handleLike = async (post: Post) => {
  if (!agent) return;
  
  // Get current interaction state
  const currentInteractions = postInteractions.get(post.uri);
  const isCurrentlyLiked = currentInteractions?.hasLiked || false;
  
  // Optimistically update UI
  setPostInteractions(prev => new Map(prev).set(post.uri, {
    ...prev.get(post.uri),
    hasLiked: !isCurrentlyLiked
  }));

  try {
    if (!isCurrentlyLiked) {
      await agent.app.bsky.feed.like.create(
        { repo: agent.session?.did },
        {
          subject: { uri: post.uri, cid: post.cid },
          createdAt: new Date().toISOString(),
        }
      );
    } else {
      await agent.deleteLike(post.uri);
    }
  } catch (err) {
    console.error('Error toggling like:', err);
    // Revert UI on error
    setPostInteractions(prev => new Map(prev).set(post.uri, {
      ...prev.get(post.uri),
      hasLiked: isCurrentlyLiked
    }));
  }
};


// End handleLike Function  
  
useEffect(() => {
  async function checkInteractions() {
    if (!agent || !user) return;
    
    const newInteractions = new Map();
    
    for (const post of posts) {
      try {
        // Check likes and thread in parallel
        const [likesResponse, threadResponse] = await Promise.all([
          agent.getLikes({ uri: post.uri }),
          agent.getPostThread({ uri: post.uri, depth: 1 })
        ]);

        // Check if user has liked this post
        const hasLiked = likesResponse.data.likes.some(
          like => like.actor.did === user.did
        );

        // Check if user has replied to this post
        const hasReplied = threadResponse.data.thread.replies?.some(
          (reply: any) => reply.post.author.did === user.did
        ) || false;

        newInteractions.set(post.uri, { hasLiked, hasReplied });
      } catch (err) {
        console.error('Error checking interactions:', err);
      }
    }
    
    setPostInteractions(newInteractions);
  }

  checkInteractions();
}, [agent, posts, user?.did]);


  
  // Filter posts based on time range
  const filteredPosts = posts.filter(post => {
    const postDate = parseISO(post.indexedAt);
    const now = new Date();
    const filterDate = {
      last24h: subDays(now, 1),
      last3d: subDays(now, 3),
      last7d: subDays(now, 7),
    }[timeRange];
    return postDate >= filterDate;
  });

  // Sort posts based on selected column
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    switch (sortColumn) {
      case 'content':
        return a.record.text.localeCompare(b.record.text);
      case 'likes':
        return b.likeCount - a.likeCount;
      case 'shares':
        return b.repostCount - a.repostCount;
      case 'comments':
        return b.replyCount - a.replyCount;
      case 'time':
        return new Date(b.indexedAt).getTime() - new Date(a.indexedAt).getTime();
      default:
        return 0;
    }
  });

  const formatTime = (time: string) => {
    const now = new Date();
    const postDate = new Date(time);
    const diffInDays = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60 * 60 * 24));
    const diffInHours = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60 * 60));
    return diffInHours >= 24 ? `${diffInDays}d` : `${diffInHours}h`;
  };

  const truncateText = (text: string) => {
    return text.length > 22 ? text.substring(0, 22) + '...' : text;
  };

  const getColumnIcon = (column: SortColumn) => {
    const icons = {
      content: null,
      time: <Clock className={`w-4 h-4 ${sortColumn === 'time' ? 'text-yellow-500' : 'text-gray-400'}`} />,
      likes: <Heart className={`w-4 h-4 ${sortColumn === 'likes' ? 'text-red-500' : 'text-gray-400'}`} />,
      shares: <Share2 className={`w-4 h-4 ${sortColumn === 'shares' ? 'text-green-500' : 'text-gray-400'}`} />,
      comments: <MessageCircle className={`w-4 h-4 ${sortColumn === 'comments' ? 'text-purple-500' : 'text-gray-400'}`} />
    };
    return icons[column];
  };

  // Generate a unique key for each post
  const getUniqueKey = (post: Post, index: number) => {
    const timestamp = new Date(post.indexedAt).getTime();
    return `${post.uri}-${post.cid}-${timestamp}-${post.author.did}-${index}`;
  };

//const getPostUrl = (post) => {
    // Extract post ID from getUniqueKey
   // const postId = getUniqueKey(post, 0).split('-')[1]; // Get the CID
   // return `https://bsky.app/profile/${post.author.handle}/post/${postId}`;
 // };

//const openPostUrl = (url) => {
 // window.open(url, '_blank');
//};
  
  return (
    <div className="relative" ref={tableRef}>
      <div className="mb-4 flex items-center justify-end space-x-2">
        <span className="text-sm text-gray-500">Time Range:</span>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as TimeRange)}
          className="text-sm border border-gray-200 rounded-md px-2 py-1"
        >
          <option value="last24h">Last 24h</option>
          <option value="last3d">Last 3d</option>
          <option value="last7d">Last 7d</option>
        </select>
      </div>

      <table className="w-full">
        <thead>
          <tr className="text-left text-sm text-blue-500 border-b border-gray-200">
            <th className="pb-2 font-medium w-1/2">
              <button 
                onClick={() => setSortColumn('content')}
                className="hover:opacity-75 transition-opacity"
                title="Sort by content"
              >
                Trending Posts... 🔥
              </button>
            </th>
            <th className="pb-2 font-medium text-right">
              <button 
                onClick={() => setSortColumn('likes')}
                className="hover:opacity-75 transition-opacity"
                title="Sort by likes"
              >
                {getColumnIcon('likes')}
              </button>
            </th>
            <th className="pb-2 font-medium text-right">
              <button 
                onClick={() => setSortColumn('shares')}
                className="hover:opacity-75 transition-opacity"
                title="Sort by shares"
              >
                {getColumnIcon('shares')}
              </button>
            </th>
            <th className="pb-2 font-medium text-right">
              <button 
                onClick={() => setSortColumn('comments')}
                className="hover:opacity-75 transition-opacity"
                title="Sort by comments"
              >
                {getColumnIcon('comments')}
              </button>
            </th>
            <th className="pb-2 font-medium text-right">
              <button 
                onClick={() => setSortColumn('time')}
                className="hover:opacity-75 transition-opacity"
                title="Sort by time"
              >
                {getColumnIcon('time')}
              </button>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {sortedPosts.slice(0, 10).map((post, index) => (
            <tr 
              key={getUniqueKey(post, index)}
              className="text-xs hover:bg-gray-50"
              //onMouseEnter={() => !IsFrozen && setHoveredPost(post)}
              //onMouseLeave={() => !IsFrozen && setHoveredPost(null)}
              //title={hoveredPost ? "click to pin post" : undefined} // Conditionally set the title
            >
              <td className="py-2" 
                onMouseEnter={() => !IsFrozen && setHoveredPost(post)}
                onMouseLeave={() => !IsFrozen && setHoveredPost(null)}
                title={hoveredPost ? "click to pin 📌" : undefined || IsFrozen ? "unpin post 📌" : undefined } // Conditionally set the title
                >
                <div 
                  className={`hover:underline cursor-pointer ${hoveredPost === post && !IsFrozen || frozenPost === post && IsFrozen ? 'underline' : ''} ${postInteractions.get(post.uri)?.hasReplied ? 'text-indigo-500' : ''}`}
                  
                 onClick={() => {
                  setIsFrozen(!IsFrozen);
                  if (!IsFrozen) {
                    setFrozenPost(hoveredPost); // Freeze the current hovered post
                    setHoveredPost(null) // clear the hovered post
                  } else {
                    setFrozenPost(null); // Unfreeze the post
                  }
                }}
                >
                  {truncateText(post.record.text)}
                </div>
              </td>
              <td className="py-2 text-red-500 text-right">{formatNumber(post.likeCount)}</td>
              <td className="py-2 text-gray-500 text-right">{formatNumber(post.repostCount)}</td>
              <td className="py-2 text-gray-500 text-right">{formatNumber(post.replyCount)}</td>
              <td className="py-2 text-gray-500 text-right">{formatTime(post.indexedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
 
      
      {(IsFrozen ? frozenPost : hoveredPost) && (
        <div 
          className="fixed z-50 bg-white rounded-lg shadow-xl p-4 border border-gray-200"
          style={{ 
            top: '50%',
            right: '25rem',
            transform: 'translateY(-50%)',
            width: '400px', 
            //pointerEvents: IsFrozen ? 'none' : 'auto'
          }}
        >
          
         <div className="flex justify-between">
           <div className="flex items-center">
             {postInteractions.get((IsFrozen ? frozenPost : hoveredPost).uri)?.hasReplied && (
      <span className="text-xs text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">
        Already replied
      </span>
           )}
            </div>
          <button 
              //onClick={() => {setFrozenPost(null);}} // Unfreeze the post
                     onClick={() => {
                  setIsFrozen(!IsFrozen);
                  if (!IsFrozen) {
                    setFrozenPost(hoveredPost); // Freeze the current hovered post
                    setHoveredPost(null) // clear the hovered post
                  } else {
                    setFrozenPost(null); // Unfreeze the post
                  }
                }}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
          <div className="flex items-start space-x-3"  >
            <img
              src={(IsFrozen ? frozenPost : hoveredPost).author.avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100&h=100&fit=crop'}
              alt={(IsFrozen ? frozenPost : hoveredPost).author.displayName || IsFrozen ? frozenPost : hoveredPost.author.handle}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="flex-1">
              <p className="font-medium">
                {(IsFrozen ? frozenPost : hoveredPost).author.displayName || hoveredPost.author.handle}
              </p>
              <p className="text-sm text-gray-500">@{(IsFrozen ? frozenPost : hoveredPost).author.handle}</p>
              <p className="text-xs text-gray-800  whitespace-pre-wrap break-words mt-2">{(IsFrozen ? frozenPost : hoveredPost).record.text}</p>
              {(IsFrozen ? frozenPost : hoveredPost).record.embed && (IsFrozen ? frozenPost : hoveredPost).record.embed?.images && (IsFrozen ? frozenPost : hoveredPost).record.embed?.images.length > 0 && (
<div className="flex-grow relative text-gray-800 grid grid-cols-2">
  <div className={`grid gap-0.5 ${
      (IsFrozen ? frozenPost : hoveredPost).record.embed.images.length === 1 ? 'grid-cols-1' :
      (IsFrozen ? frozenPost : hoveredPost).record.embed.images.length === 2 ? 'grid-cols-2' :
      (IsFrozen ? frozenPost : hoveredPost).record.embed.images.length === 3 ? 'grid-cols-2' :
      'grid-cols-2'
    }`}>
  {(IsFrozen ? frozenPost : hoveredPost).record.embed.images.map((image, index) => (
        <div
          key={index}
            className={`${
            // Special handling for 3 images - make last image full width
            (IsFrozen ? frozenPost : hoveredPost).record.embed.images.length === 3 && index === 2 
              ? 'col-span-2' 
              : ''
          }`}>
          
  <img className="rounded-md w-full h-full object-cover"
src={
`https://cdn.bsky.app/img/feed_thumbnail/plain/${(IsFrozen ? frozenPost : hoveredPost).author.did}/${image.image?.ref?.asCID.toString()}@jpeg`}
alt={`Post Image ${index + 1}`}
style={{ aspectRatio: (IsFrozen ? frozenPost : hoveredPost).record.embed.images.length === 1 ? '16/9' :
                          (IsFrozen ? frozenPost : hoveredPost).record.embed.images.length === 2 ? '1/1' :
                          (IsFrozen ? frozenPost : hoveredPost).record.embed.images.length === 3 && index === 2 ? '2/1' :
                          (IsFrozen ? frozenPost : hoveredPost).record.embed.images.length === 4 ? '1/1' : '1/1', objectFit: 'cover' }} 
//style={{ width: 'auto', height: 'auto', objectFit: 'cover' }}
                   />
        </div>
      ))}
    </div>
  </div>
  )}

              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                <span className="flex items-center space-x-1">
                  <Heart className={`w-4 h-4 cursor-pointer ${
      postInteractions.get((IsFrozen ? frozenPost : hoveredPost).uri)?.hasLiked 
        ? 'fill-current text-red-500' 
        : ''
          
    }`} 
    onClick={(e) => {
       e.stopPropagation(); // Prevent post selection
       handleLike(IsFrozen ? frozenPost : hoveredPost);
  }}
                    
                    />
                  <span>{formatNumber((IsFrozen ? frozenPost : hoveredPost).likeCount)}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Share2 className="w-4 h-4 text-gray-400" />
                  <span>{formatNumber((IsFrozen ? frozenPost : hoveredPost).repostCount)}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <MessageCircle className="w-4 h-4 text-gray-400" />
                  <span>{formatNumber((IsFrozen ? frozenPost : hoveredPost).replyCount)}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>{formatTime((IsFrozen ? frozenPost : hoveredPost).indexedAt)}</span>
                </span>

                {/*<span className="flex items-center space-x-1">
                  <ExternalLink className="w-4 h-4 text-blue-500" />*/}
                  <span>
                     {/*console.log("Current Post:", IsFrozen ? frozenPost : hoveredPost)*/} {/* Add the console.log here */}
                     
                        {/* Log the post AND the generated URL */}
        {/*console.log(
          "Current Post:",
          IsFrozen ? frozenPost : hoveredPost,
          "Generated URL:",
          getPostUrl(IsFrozen ? frozenPost : hoveredPost) // Execute getPostUrl inside console.log
        )*/}
                {/* Conditionally render the link based on post existence */}
                {(IsFrozen ? frozenPost : hoveredPost) && (IsFrozen ? frozenPost : hoveredPost).uri && (
              //<a //href="https://bsky.app/profile/oluadedeji.bsky.social/post/3ldltg5wp7n2w"
            //href={getPostUrl(IsFrozen ? frozenPost : hoveredPost)}
          <button 
            onClick={(e) => {
              e.preventDefault(); // Prevent default link behavior
              openPostUrl(getPostUrl(IsFrozen ? frozenPost : hoveredPost));
            }}
       className={`flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-900 hover:bg-blue-600 hover:text-white`}
              >
            <ExternalLink className="w-3 h-3" />
              <span className="text-xs" title="view this post on bluesky 🦋">View Post</span>   
              </button>)}
                </span>                  
              </div>
            </div>
          </div>
           {/* Start - Add reply form after post content */}
<div className="mt-4 border-t border-gray-100 pt-4">
  <button
    onClick={() => setIsReplying(!isReplying)}
    className="px-1 text-xs bg-blue-50 text-blue-500 rounded-full hover:text-blue-600"
  >
    {isReplying ? 'Click to Close' : 'Click to Reply'}
  </button>
  
  {isReplying && (
    <div className="mt-2">
      <textarea
        value={replyText}
        onChange={(e) => setReplyText(e.target.value)}
        placeholder="Write your reply...✍️"
        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 resize-none"
        rows={6}
      />
      <div className={`text-right text-xs mt-1 ${
        replyText.length > MAX_CHARS ? 'text-red-500' : 'text-gray-500'
      }`}>
        {MAX_CHARS - replyText.length} characters remaining
      </div>
      <div className="flex justify-end mt-2 space-x-2">
        <button
          onClick={() => setIsReplying(false)}
          className="px-3 py-1 text-sm text-gray-600 rounded-full hover:text-gray-800"
        >
          Cancel
        </button>
        <button
          onClick={handleReply}
          disabled={!replyText.trim() || replyText.length > MAX_CHARS}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:bg-blue-300"
        >
          Reply
        </button>
      </div>
    </div>
  )}
</div>
{/* End - Add reply form after post content */}
        </div>
      )}
     
    </div>
  );
}

