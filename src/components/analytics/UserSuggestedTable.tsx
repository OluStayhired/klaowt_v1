import React, { useState } from 'react';
import { useUserSuggested } from '../../hooks/useUserSuggested';
import { User } from '../../types/user';
import { 
  UserCheck, UserPlus, Heart, MessageCircle, 
  Repeat2, ArrowUp, Loader2
} from 'lucide-react';
import { formatNumber } from '../../utils/formatters';
import { useAuthStore } from '../../auth';

interface UserSuggestedTableProps {
  userDid: string;
  onUserClick?: (user: User) => void;
}

export function UserSuggestedTable({ userDid, onUserClick }: UserSuggestedTableProps) {
  const { suggestedUsers, loading, error } = useUserSuggested(userDid);
  const [followingStatus, setFollowingStatus] = useState<{[key: string]: boolean}>({});
  const { agent } = useAuthStore();

  const handleFollow = async (user: User, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!agent) return;

    try {
      if (followingStatus[user.did]) {
        await agent.deleteFollow(user.followUri!);
        setFollowingStatus(prev => ({ ...prev, [user.did]: false }));
      } else {
        const response = await agent.follow(user.did);
        setFollowingStatus(prev => ({ ...prev, [user.did]: true }));
      }
    } catch (err) {
      console.error('Error toggling follow:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 py-4">
        {error}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left text-sm text-gray-500 border-b border-gray-200">
            <th className="pb-3 font-medium">User</th>
            <th className="pb-3 font-medium text-center">
              <Heart className="w-4 h-4 inline-block" />
            </th>
            <th className="pb-3 font-medium text-center">
              <MessageCircle className="w-4 h-4 inline-block" />
            </th>
            <th className="pb-3 font-medium text-center">
              <Repeat2 className="w-4 h-4 inline-block" />
            </th>
            <th className="pb-3 font-medium text-center">Score</th>
            <th className="pb-3 font-medium"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {suggestedUsers.map((user) => (
            <tr 
              key={user.did}
              onClick={() => onUserClick?.(user)}
              className="hover:bg-gray-50 cursor-pointer"
            >
              <td className="py-3">
                <div className="flex items-center space-x-3">
                  <img
                    src={user.avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100&h=100&fit=crop'}
                    alt={user.displayName || user.handle}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {user.displayName || user.handle}
                    </p>
                    <p className="text-xs text-gray-500">@{user.handle}</p>
                  </div>
                </div>
              </td>
              <td className="py-3 text-center">
                <span className="text-xs">{formatNumber(user.interactions.likes)}</span>
              </td>
              <td className="py-3 text-center">
                <span className="text-xs">{formatNumber(user.interactions.comments)}</span>
              </td>
              <td className="py-3 text-center">
                <span className="text-xs">{formatNumber(user.interactions.reposts)}</span>
              </td>
              <td className="py-3 text-center">
                <div className="inline-flex items-center space-x-1 bg-blue-50 px-2 py-1 rounded-full">
                  <ArrowUp className="w-3 h-3 text-blue-500" />
                  <span className="text-xs text-blue-500">{user.engagementScore}%</span>
                </div>
              </td>
              <td className="py-3 text-right">
                <button
                  onClick={(e) => handleFollow(user, e)}
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                    followingStatus[user.did]
                      ? 'bg-gray-100 text-gray-500'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  {followingStatus[user.did] ? (
                    <UserCheck className="w-3 h-3" />
                  ) : (
                    <UserPlus className="w-3 h-3" />
                  )}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}