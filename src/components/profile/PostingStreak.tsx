import React from 'react';
import { useContributorProfile } from '../../hooks/useContributorProfile';

interface PostingStreakProps {
  did: string;
}

export function PostingStreak({ did }: PostingStreakProps) {
  const { profile } = useContributorProfile(did);

  if (!profile?.postStreak) return null;

  const getGradientColor = (count: number) => {
    if (count === 0) return 'bg-gray-100';
    if (count <= 2) return 'bg-gradient-to-br from-blue-100 to-blue-200';
    if (count <= 5) return 'bg-gradient-to-br from-blue-200 to-blue-300';
    if (count <= 10) return 'bg-gradient-to-br from-blue-300 to-blue-400';
    return 'bg-gradient-to-br from-blue-400 to-blue-500';
  };

  return (
    <div className="grid grid-cols-7 gap-1">
      {profile.postStreak.map((count, index) => (
        <div
          key={index}
          className={`aspect-square rounded-sm ${getGradientColor(count)}`}
          title={`${count} posts`}
        />
      ))}
    </div>
  );
}