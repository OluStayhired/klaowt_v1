import React, { useState } from 'react';
import { ContributorProfile } from './ContributorProfile';

interface ContributorCardProps {
  contributor: {
    did: string;
    handle: string;
    displayName?: string;
    avatar?: string;
    contributions: number;
  };
}

export function ContributorCard({ contributor }: ContributorCardProps) {
  const [showProfile, setShowProfile] = useState(false);

  return (
    <div className="relative">
      <div
        className="bg-white p-4 rounded-lg shadow-sm text-center cursor-pointer group"
        onMouseEnter={() => setShowProfile(true)}
        onMouseLeave={() => setShowProfile(false)}
      >
        <img
          src={contributor.avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100&h=100&fit=crop'}
          alt={contributor.displayName || contributor.handle}
          className="w-12 h-12 rounded-full mx-auto mb-2 object-cover"
        />
        <p className="font-medium text-sm truncate">
          {contributor.displayName || contributor.handle}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {contributor.contributions} posts
        </p>
      </div>

      {showProfile && (
        <ContributorProfile
          did={contributor.did}
          className="absolute z-10 top-full left-0 mt-2 w-64"
        />
      )}
    </div>
  );
}