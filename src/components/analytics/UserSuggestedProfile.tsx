import React, { useState, useEffect, useRef } from 'react';
import { useUserSuggestedProfile } from '../../hooks/useUserSuggestedProfile';
import { Loader2, X, UserCheck, UserPlus, Flame, Heart, MessageCircle, Clock } from 'lucide-react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useAuthStore } from '../../auth';
import { Post } from '../types/post';
import { formatNumber } from '../../utils/formatters';

interface UserSuggestedProfileProps {
  did: string;
  onClose: () => void;
  className?: string;
}

export function UserSuggestedProfile({ did, onClose, className = '' }: UserSuggestedProfileProps) {
  const { profile, loading, error } = useUserSuggestedProfile(did);
  const { agent, user } = useAuthStore();
  const [isFollowing, setIsFollowing] = React.useState(false);
  const [isExpanded, setIsExpanded] = useState(false);



  // Add new state variables
const [recentPost, setRecentPost] = useState<Post | null>(null);
const [hasLikedPost, setHasLikedPost] = useState(false);
const [hasRepliedToPost, setHasRepliedToPost] = useState(false);

const truncatedText = recentPost?.record.text.slice(0, 80);
const shouldTruncate = recentPost?.record.text.length > 80;

  
const formatTime = (time: string) => {
    const now = new Date();
    const postDate = new Date(time);
    const diffInDays = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60 * 60 * 24));
    const diffInHours = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60 * 60));
    return diffInHours >= 24 ? `${diffInDays}d` : `${diffInHours}h`;
  };
  
// Add to the existing useEffect that fetches profile data:
useEffect(() => {
  async function fetchProfileAndPost() {
    if (!agent) return;

    try {
      const feedResponse = await agent.getAuthorFeed({
        actor: did,
        limit: 1,
        filter: 'posts_no_replies'
      });

      if (feedResponse?.data?.feed?.[0]) {
        const post = feedResponse.data.feed[0].post;
        
        // If there's a quoted post, fetch it using getPostThread
        if (post.record.embed?.record?.uri) {
          const threadResponse = await agent.getPostThread({
            uri: post.record.embed.record.uri,
            depth: 0 // We only need the quoted post itself
          });
          
          if (threadResponse?.data?.thread?.post) {
            // Merge the quoted post data into the embed record
            post.record.embed.record = {
              ...post.record.embed.record,
              ...threadResponse.data.thread.post
            };
          }
        }

        // Fetch likes and thread info in parallel
        const [likesResponse, postThreadResponse] = await Promise.all([
          agent.getLikes({ uri: post.uri }),
          agent.getPostThread({ uri: post.uri, depth: 1 })
        ]);

        // Check user interactions
        const hasLiked = likesResponse.data.likes.some(
          like => like.actor.did === user?.did
        );
        const hasReplied = postThreadResponse.data.thread.replies?.some(
          reply => reply.post.author.did === user?.did
        );

        // Set all the post data at once
        setRecentPost(post);
        setHasLikedPost(hasLiked);
        setHasRepliedToPost(hasReplied);
      }
    } catch (err) {
      console.error('Error fetching recent post:', err);
    }
  }

  fetchProfileAndPost();
}, [agent, did, user?.did]);



  React.useEffect(() => {
    async function checkFollowStatus() {
      if (!agent) return;
      try {
        const response = await agent.getProfile({
          actor: did,
        });
        setIsFollowing(response.data.viewer?.following ? true : false);
      } catch (err) {
        console.error('Error checking follow status:', err);
      }
    }

    checkFollowStatus();
  }, [agent, did]);

  const handleFollow = async () => {
    if (!agent || isFollowing) return;
    try {
      await agent.follow(did);
      setIsFollowing(true);
    } catch (err) {
      console.error('Error following:', err);
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-4 ${className}`}>
        <div className="flex justify-center">
          <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return null;
  }

  const truncatedBio = profile.description 
    ? profile.description.length > 150 
      ? `${profile.description.substring(0, 150)}...` 
      : profile.description
    : '';

  const currentStreak = profile.postStreak.reverse().findIndex(count => count === 0);
  const streakCount = currentStreak === -1 ? profile.postStreak.length : currentStreak;

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <img
              src={profile.avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100&h=100&fit=crop'}
              alt={profile.displayName || profile.handle}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <h4 className="font-semibold">{profile.displayName || profile.handle}</h4>
              <p className="text-sm text-gray-500">@{profile.handle}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleFollow}
              disabled={isFollowing}
              className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm ${
                isFollowing 
                  ? 'bg-gray-100 text-gray-500 cursor-default'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {isFollowing ? (
                <>
                  <UserCheck className="w-3 h-3 text-xs" />
                  <span>Following</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-3 h-3 text-xs" />
                  <span>Follow</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {profile.description && (
          <div className="mb-4">
            <p className="text-xs text-gray-600">{truncatedBio}</p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm">
            <span className="text-gray-500">
              <strong className="text-gray-900">{profile.followersCount.toLocaleString()}</strong> followers
            </span>
            <span className="text-gray-500">
              <strong className="text-gray-900">{profile.followsCount.toLocaleString()}</strong> following
            </span>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <Flame className="w-4 h-4 text-orange-500 mr-1" />
            <span>{streakCount} day streak</span>
          </div>
        </div>
      </div>
      {/*Start - Add Recent Post Information*/}
{/* Recent Post Section */}
{recentPost && (
  <div className="mt-4 border-t border-gray-100 pt-4">
    <h4 className="px-2 text-xs font-medium text-gray-700 mb-2">Recent Post</h4>
    <div className="bg-gray-50 rounded-lg p-3">
      {/* Replace the existing text display with this */}
<p className="px-2 text-xs text-gray-800">
  {isExpanded ? recentPost.record.text : truncatedText}
  {shouldTruncate && !isExpanded && '...'}
</p>
{shouldTruncate && (
  <button
    onClick={() => setIsExpanded(!isExpanded)}
    className="text-blue-500 hover:text-blue-600 text-xs mt-1 flex items-center px-2"
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

      {/*<p className="px-2 text-xs text-gray-800">{recentPost.record.text}</p>*/}
      {/* Start - Handle embedded images */}
      {recentPost.record.embed?.images && (
        <div className={`mt-2 grid gap-0.5 ${
          recentPost.record.embed.images.length === 1 ? 'grid-cols-1' :
          recentPost.record.embed.images.length === 2 ? 'grid-cols-2' :
          recentPost.record.embed.images.length === 3 ? 'grid-cols-2' :
          'grid-cols-2'
        }`}>
          {recentPost.record.embed.images.map((image, index) => (
            <div
              key={index}
              className={`${
                recentPost.record.embed.images.length === 3 && index === 2 
                  ? 'col-span-2' 
                  : ''
              }`}
            >
              <img
                className="rounded-md w-full h-full object-cover"
                src={`https://cdn.bsky.app/img/feed_thumbnail/plain/${recentPost.author.did}/${image.image?.ref?.asCID.toString()}@jpeg`}
                alt={`Post Image ${index + 1}`}
                style={{
                  aspectRatio: recentPost.record.embed.images.length === 1 ? '16/9' :
                             recentPost.record.embed.images.length === 2 ? '1/1' :
                             recentPost.record.embed.images.length === 3 && index === 2 ? '2/1' :
                             '1/1'
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Handle external links */}
      {recentPost.record.embed?.external?.thumb?.ref && (
        <div className="mt-2">
          <a 
            href={recentPost.record.embed.external.uri}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-md overflow-hidden"
          >
            <img
              className="w-full h-32 object-cover"
              src={`https://cdn.bsky.app/img/feed_thumbnail/plain/${recentPost.author.did}/${recentPost.record.embed.external.thumb.ref?.asCID.toString()}@jpeg`}
              alt={recentPost.record.embed.external.title || "External content"}
            />
          </a>
        </div>
      )}

      {/* Handle quoted posts */}
      {recentPost.record.embed?.record && (
        <div className="mt-2 border-l-2 border-gray-200 pl-3">
          <div className="text-xs">
            <span className="font-medium">{recentPost.record.embed.record.author?.displayName}</span>
            <span className="text-gray-500"> @{recentPost.record.embed.record.author?.handle}</span>
          </div>
          <p className="text-xs text-gray-700 mt-1">{recentPost.record.embed.record.text}</p>
        </div>
      )}
      {/*End - Handle embedded images and links*/}
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center space-x-4 text-xs text-gray-500">
          <span className="flex items-center space-x-1">
            <Heart className={`w-4 h-4 ${hasLikedPost ? 'fill-current text-red-500' : ''}`} />
            <span>{formatNumber(recentPost.likeCount)}</span>
          </span>
          <span className="flex items-center space-x-1">
            <MessageCircle className="w-4 h-4" />
            <span>{formatNumber(recentPost.replyCount)}</span>
          </span>
          <span className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>{formatTime(recentPost.indexedAt)}</span>
          </span>
        </div>
        
        {hasRepliedToPost && (
          <span className="text-xs text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">
            Already replied
          </span>
        )}
      </div>
    </div>
  </div>
)}

      {/*End - Add Recent Post Information*/}
    </div>
  );
} 
export default UserSuggestedProfile;