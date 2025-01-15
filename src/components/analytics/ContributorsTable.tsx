import React, { useState } from 'react';
import { ContributorStats } from '../../types/contributor';
import { 
  Pencil, MessageCircle, Heart, Share2, X, UserCheck, UserPlus
} from 'lucide-react';
import { formatNumber } from '../../utils/formatters';
import { ContributorProfile } from './ContributorProfile';
import { useAuthStore } from '../../auth';

interface ContributorsTableProps {
  contributors: ContributorStats[];
}

type TimeRange = 'last24h' | 'last3d' | 'last7d';
type SortColumn = 'posts' | 'likes' | 'shares' | 'comments';

export function ContributorsTable({ contributors }: ContributorsTableProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('last7d');
  const [sortColumn, setSortColumn] = useState<SortColumn>('likes');
  const [selectedContributor, setSelectedContributor] = useState<string | null>(null);
  const { agent } = useAuthStore();
  const [followingStatus, setFollowingStatus] = useState<{[key: string]: boolean}>({});

  React.useEffect(() => {
    async function checkFollowStatus() {
      if (!agent) return;
      
      const statuses: {[key: string]: boolean} = {};
      for (const contributor of contributors) {
        try {
          const response = await agent.getProfile({
            actor: contributor.did,
          });
          statuses[contributor.did] = response.data.viewer?.following ? true : false;
        } catch (err) {
          console.error('Error checking follow status:', err);
        }
      }
      setFollowingStatus(statuses);
    }

    checkFollowStatus();
  }, [agent, contributors]);

  // Sort contributors by selected column
  const sortedContributors = [...contributors]
    .sort((a, b) => b.stats[sortColumn][timeRange] - a.stats[sortColumn][timeRange])
    .slice(0, 10);

  const truncateText = (text: string, length: number) => {
    return text.length > length ? text.substring(0, length) + '...' : text;
  };

  const getColumnIcon = (column: SortColumn) => {
    const icons = {
      posts: <Pencil className={`w-4 h-4 ${sortColumn === 'posts' ? 'text-blue-500' : 'text-gray-400'}`} />,
      likes: <Heart className={`w-4 h-4 ${sortColumn === 'likes' ? 'text-red-500' : 'text-gray-400'}`} />,
      shares: <Share2 className={`w-4 h-4 ${sortColumn === 'shares' ? 'text-green-500' : 'text-gray-400'}`} />,
      comments: <MessageCircle className={`w-4 h-4 ${sortColumn === 'comments' ? 'text-purple-500' : 'text-gray-400'}`} />
    };
    return icons[column];
  };

  return (
    <div className="relative">
      <div className="w-full overflow-x-auto">
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
              <th className="pb-3 font-medium">Active Contributors ✍️</th>
              <th className="pb-3 font-medium">
                <button 
                  onClick={() => setSortColumn('likes')}
                  className="hover:opacity-75 transition-opacity"
                  title="Sort by likes"
                >
                  {getColumnIcon('likes')}
                </button>
              </th>
              <th className="pb-3 font-medium">
                <button 
                  onClick={() => setSortColumn('posts')}
                  className="hover:opacity-75 transition-opacity"
                  title="Sort by posts"
                >
                  {getColumnIcon('posts')}
                </button>
              </th>
              <th className="pb-3 font-medium">
                <button 
                  onClick={() => setSortColumn('shares')}
                  className="hover:opacity-75 transition-opacity"
                  title="Sort by shares"
                >
                  {getColumnIcon('shares')}
                </button>
              </th>
              <th className="pb-3 font-medium">
                <button 
                  onClick={() => setSortColumn('comments')}
                  className="hover:opacity-75 transition-opacity"
                  title="Sort by comments"
                >
                  {getColumnIcon('comments')}
                </button>
              </th>
              <th className="pb-3 font-medium text-center" aria-label="Following status">
                {followingStatus ? <UserCheck className="w-4 h-4 mx-auto text-gray-400" /> : <UserPlus className="w-4 h-4 mx-auto text-gray-400" />}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedContributors.map((contributor) => (
              <tr 
                key={contributor.did} 
                className={`hover:bg-gray-50 cursor-pointer ${selectedContributor === contributor.did ? 'bg-blue-50' : ''}`}
                onClick={() => setSelectedContributor(contributor.did)}
              >
                <td className="py-3">
                  <div className="flex items-center space-x-3">
                    <img
                      src={contributor.avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100&h=100&fit=crop'}
                      alt={contributor.displayName || contributor.handle}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-xs font-medium text-gray-900">
                        {truncateText(contributor.displayName || contributor.handle, 10)}
                      </p>
                      <p className="text-xs text-gray-500">
                        @{truncateText(contributor.handle, 10)}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="py-3">
                  <p className="text-xs text-red-500">
                    {formatNumber(contributor.stats.likes[timeRange])}
                  </p>
                </td>
                <td className="py-3">
                  <p className="text-xs text-gray-500">
                    {formatNumber(contributor.stats.posts[timeRange])}
                  </p>
                </td>
                <td className="py-3">
                  <p className="text-xs text-gray-500">
                    {formatNumber(contributor.stats.shares[timeRange])}
                  </p>
                </td>
                <td className="py-3">
                  <p className="text-xs text-gray-500">
                    {formatNumber(contributor.stats.comments[timeRange])}
                  </p>
                </td>
                <td className="py-3 text-center">
                  {followingStatus[contributor.did] ? (
                    <UserCheck className="w-4 h-4 text-green-500 mx-auto" />
                  ) : (
                    <UserPlus className="w-4 h-4 text-gray-400 mx-auto" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Profile modal */}
      {selectedContributor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="w-96">
            <ContributorProfile 
              did={selectedContributor}
              onClose={() => setSelectedContributor(null)}
              className="w-full"
            />
          </div>
        </div>
      )}
    </div>
  );
}