import React, { useState, useEffect, useRef } from 'react';
import { 
  User, UserCheck, UserPlus, Pin, PlusCircle, 
  Heart, MessageCircle, Repeat2, ArrowUp, 
  AlertCircle, CheckCircle2, BarChart2
} from 'lucide-react';
import { User as UserType } from '../../types/user';
import { formatNumber } from '../../utils/formatters';
import { useAuthStore } from '../../auth';

interface UserCardProps {
  user: UserType;
  isPinned: boolean;
  onPin: (user: UserType, e: React.MouseEvent) => void;
  onFollowChange?: (following: boolean) => void;
  onClick: () => void;
   onInteractionUpdate?: (updates: {
    liked: boolean;
    commented: boolean;
    reposted: boolean;
  }) => void;
}

export function UserCard({ user, isPinned, onPin, onClick, onFollowChange }: UserCardProps) {
  const { agent } = useAuthStore();
  const buttonRef = useRef<HTMLButtonElement>(null);  
  // Add local state for each interaction type
const [localInteractions, setLocalInteractions] = useState({
  liked: user.myInteractions.liked,
  commented: user.myInteractions.commented,
  reposted: user.myInteractions.reposted,
  counts: {
    likes: user.interactions.likes,
    comments: user.interactions.comments,
    reposts: user.interactions.reposts
  }
});

    useEffect(() => {
        setLocalInteractions({
            liked: user.myInteractions.liked,
            commented: user.myInteractions.commented,
            reposted: user.myInteractions.reposted,
            counts: {
                likes: user.interactions.likes,
                comments: user.interactions.comments,
                reposts: user.interactions.reposts
            }
        });
    }, [user]); // Update localInteractions when user prop changes

  
 //Add handlers for all updates:

// Add handlers for each interaction type
//const handleLikeUpdate = (isLiked: boolean) => {
  //setLocalInteractions(prev => ({
    //...prev,
    //liked: isLiked,
    //counts: {
     // ...prev.counts,
      //likes: prev.counts.likes + (isLiked ? 1 : -1)
    //}
  //}));
//};

const handleLikeUpdate = (isLiked: boolean) => {
  setLocalInteractions(prev => {
    const newState = {
      ...prev,
      liked: isLiked,
      counts: {
        ...prev.counts,
        likes: prev.counts.likes + (isLiked ? 1 : -1)
      }
    };
    onInteractionUpdate?.({
      liked: newState.liked,
      commented: newState.commented,
      reposted: newState.reposted
    });
    return newState;
  });
};  

const handleCommentUpdate = (hasCommented: boolean) => {
  setLocalInteractions(prev => ({
    ...prev,
    commented: hasCommented,
    counts: {
      ...prev.counts,
      comments: prev.counts.comments + (hasCommented ? 1 : -1)
    }
  }));
};

const handleRepostUpdate = (hasReposted: boolean) => {
  setLocalInteractions(prev => ({
    ...prev,
    reposted: hasReposted,
    counts: {
      ...prev.counts,
      reposts: prev.counts.reposts + (hasReposted ? 1 : -1)
    }
  }));
};
//End Add handlers for all updates




  
  // Add follow/unfollow handler
  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!agent) return;

    try {
        if (user.isFollowing && user.followUri) { // Use user.isFollowing
            await agent.deleteFollow(user.followUri);
            // Remove: setIsFollowing(false);
            // Remove: setFollowUri(null);
            onFollowChange?.(false);
        } else {
            const response = await agent.follow(user.did);
            // Remove: setIsFollowing(true);
            // Remove: setFollowUri(response.uri);
            onFollowChange?.(true);
        }
    } catch (err) {
        console.error('Error toggling follow:', err);
    }
};

  // Helper function to get engagement status color
  const getEngagementColor = (score: number) => {
    //if (score >= 80) return 'text-green-500 bg-green-50';
    //if (score >= 50) return 'text-blue-500 bg-blue-50';
    //if (score >= 30) return 'text-yellow-600 bg-yellow-100';
    return 'text-blue-500 bg-blue-50';
  };

  // Helper function to get interaction status
  //const getInteractionStatus = () => {
   // const { liked, commented, reposted } = user.myInteractions;
    //if (reposted) return { color: 'text-green-500', text: 'Reposted' };
    //if (commented && liked) return { color: 'text-blue-500', text: 'Engaged' };
    //if (liked || commented) return { color: 'text-yellow-500', text: 'Partial' };
    //return { color: 'text-red-300', text: 'Not Engaged' };
  //};

//Update getInteractions 
const getInteractionStatus = () => {
  const { reposted, commented, liked } = localInteractions;
  if (reposted) return { color: 'text-green-500', text: 'Reposted' };
  if (commented && liked) return { color: 'text-blue-500', text: 'Engaged' };
  if (liked || commented) return { color: 'text-yellow-500', text: 'Partial' };
  return { color: 'text-red-300', text: 'Not Engaged' };
};
  
  const interactionStatus = getInteractionStatus();

  return (
    <div
      data-testid="user-card"
      //onClick={onClick}
      onClick={() => {
      console.log('UserCard clicked');
      onClick();
      }}
      className="group bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-all transform hover:-translate-y-0.5 relative cursor-pointer border border-gray-100"
    >
      <div className="flex items-start space-x-3">
        <img
          src={user.avatar || `https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100&h=100&fit=crop`}
          alt={user.displayName || user.handle}
          className="w-12 h-12 rounded-full object-cover flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm truncate" title={user.displayName || user.handle}>
              {user.displayName || user.handle}
            </h4>
            
            {/*<span className={`text-xs ${interactionStatus.color} flex items-center space-x-1`}>
              {user.myInteractions.reposted ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : user.myInteractions.commented && user.myInteractions.liked ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : (
                <AlertCircle className="w-3 h-3" />
              )}
              <span>{interactionStatus.text}</span>
            </span>*/}
          </div>
          
          <p className="text-gray-500 text-xs">@{user.handle}</p>
          
          {/*start testing position for engagement*/}
          <span className={`text-xs ${interactionStatus.color} flex items-center space-x-1`} 
title={`engagement with their last post`} >
              {localInteractions.reposted ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : localInteractions.commented && localInteractions.liked ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : (
                <AlertCircle className="w-3 h-3" />
              )}
            {/*<span>{interactionStatus.text}</span>*/}
            
            <span>{getInteractionStatus().text}</span>
                 
            </span>
          {/*end testing position for engagement*/}
          
          {user.description && (
            <p className="text-gray-600 text-xs line-clamp-2 mt-1" title={user.description}>
              {user.description}
            </p>
          )}

                 
  
          
          {/* Interaction Stats - Hide this */}
          
          <div className="flex items-center space-x-4 mt-2 pb-2 border-b border-gray-100">
            <div className="flex items-center space-x-1">
              <MessageCircle className={`w-3.5 h-3.5 ${localInteractions.commented ? 'text-blue-500 fill-current' : 'text-gray-400'}`} />
              <span className="text-xs text-gray-500">{formatNumber(localInteractions.counts.comments)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Repeat2 className={`w-3.5 h-3.5 ${localInteractions.reposted ? 'text-green-500' : 'text-gray-400'}`} />
              <span className="text-xs text-gray-500">{formatNumber(localInteractions.counts.reposts)}</span>     
            </div> 
            <div className="flex items-center space-x-1">
              <Heart className={`w-3.5 h-3.5 ${localInteractions.liked ? 'text-red-500 fill-current' : 'text-gray-400'}`} />
              <span className="text-xs text-gray-500">{formatNumber(localInteractions.counts.likes)}</span>
            </div>
      

            
{/*
<span className={`text-xs ${interactionStatus.color} flex items-center space-x-1`} 
title={`Your engagement with their last post (${interactionStatus.text})`} >
              {user.myInteractions.reposted ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : user.myInteractions.commented && user.myInteractions.liked ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : (
                <AlertCircle className="w-3 h-3" />
              )}
              <span>{interactionStatus.text}</span>
                 
            </span> */}
            
          </div>
       
          {/* Follow Stats and Engagement Score */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex space-x-2 text-xs">
              <div className="flex space-x-1 text-xs">
                    <UserPlus className="w-3 h-3 text-green-400" />
                    <span className="text-gray-500 text-xs text-left">{formatNumber(user.followersCount)} followers</span>
              </div>
              <div className="flex space-x-1 text-xs">
               <UserCheck className="w-3 h-3 text-blue-400" />
              <span className="text-gray-500 text-xs text-left">{formatNumber(user.followsCount)} following</span>
              </div>
            </div>
          
            {/* Engagement Score with Hover */}
            <div 
              className={`${getEngagementColor(user.engagementScore)} text-xs px-2 py-1 rounded-full flex items-center space-x-1 group-hover:shadow-md transition-shadow cursor-help`}
              title={`Their relative engagement with my posts ${user.engagementScore}%`}
            >
              <BarChart2 className="w-3 h-3" />
              <span className="text-xs">{user.engagementScore}% interactions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons*/}
      <div className="absolute top-2 right-2 flex space-x-2">
        {isPinned ? (
          <div className="p-1.5 text-gray-400" title="Pinned user">
            <Pin className="w-4 h-4" />
          </div>
        ) : (
          <button
            onClick={(e) => onPin(user, e)}
            className="p-1.5 bg-blue-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-600"
            title="Pin user"
          >
            <PlusCircle className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={handleFollow}
          className={`flex items-center px-2 py-0.5 rounded-full text-xs ${
            user.isFollowing 
              ? 'bg-gray-100 text-gray-500'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          } opacity-0 group-hover:opacity-100 transition-opacity`}
        >
          {user.isFollowing ? (
            <UserCheck className="w-3 h-3" />
          ) : (
            <UserPlus className="w-3 h-3" />
          )}
        </button>
      </div>
    </div>
  );
}