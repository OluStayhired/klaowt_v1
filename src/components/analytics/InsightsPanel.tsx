import React, { useState } from 'react';
import { ContributorsTable } from './ContributorsTable';
import { TopPostsTable } from './TopPostsTable';
//import TopPostsTable from './components/analytics/TopPostsTable';
import { 
  Users, TrendingUp,
  Info 
} from 'lucide-react';
import { useAnalytics } from '../../hooks/useAnalytics';
import { Loader2 } from 'lucide-react';

interface InsightsPanelProps {
  feedUri: string;
  feedName: string;
  feedDescription: string;
}

export function InsightsPanel({ 
  feedUri, 
  feedName, 
  feedDescription
}: InsightsPanelProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '3d' | '24h'>('7d');
  const { data, loading, error } = useAnalytics(feedUri);
  const [showContributorsTooltip, setShowContributorsTooltip] = useState(false); // State for tooltip visibility
  const [showAnalysisTooltip, setShowAnalysisTooltip] = useState(false); // State for tooltip visibility
  const [tooltipMessage, setTooltipMessage] = useState("");

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">{error || 'Failed to load insights'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Data Source Info */}
      <div className="bg-blue-50 p-4 rounded-lg flex items-start space-x-3">
        <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-blue-500">
          Insights are based on the 100 most recent posts in this feed.
        </p>
      </div>

      {/* Top Contributors */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold flex items-center space-x-2">
          <Users className="w-5 h-5 text-blue-500" />
          <span className="flex items-left" >
             Top Contributors
                <span className="flex items-center cursor-pointer hover:text-gray-500"
            onMouseEnter={() =>{setShowContributorsTooltip(true);
        setTooltipMessage("instantly follow the top contributors on this feed ↗️");
            }}
                    onMouseLeave={() => setShowContributorsTooltip(false)}
                >
                <Info className="w-3 h-3 text-gray-400 ml-1"/> 
                {showContributorsTooltip && ( // Tooltip content displayed conditionally
                <div className="flex-1 items-left justify-left absolute ml-5 bg-gray-800 w-half text-xs text-white px-2 py-1 rounded-md shadow-sm max-w-48 max-h-24 z-10 mb-10"> {tooltipMessage} 
                </div>
                )}
                  </span>
          
          </span>
        </h3>
                 <span className="flex items-left text-xs text-gray-400">
            Discover & follow big accounts 🦋 with similar interests!
          </span>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <ContributorsTable contributors={data.topContributors} />
        </div>
      </div>

      {/* Top Posts Analysis */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          <span className="flex items-left">
            Trending Posts 
                <span className="flex items-center cursor-pointer hover:text-gray-500"
                      onMouseEnter={() =>{setShowContributorsTooltip(true);
        setTooltipMessage("view & reply to trending posts 🔥 from top contributors ↗️");
            }}
                    onMouseLeave={() => setShowContributorsTooltip(false)}
                >
              
                <Info className="w-3 h-3 text-gray-400 ml-1"/> 
                {showAnalysisTooltip && ( // Tooltip content displayed conditionally
                <div className="flex items-left justify-left absolute ml-5 bg-gray-800 w-half text-xs text-white px-2 py-1 rounded-md shadow-sm max-w-48 max-h-24 z-100 mt-1 whitespace-nowrap"> {tooltipMessage} 
                </div>         
                )}
                  </span>
              </span>
        </h3>
         <span className="flex items-left text-xs text-gray-400">
            Engage with trending posts 👋 to get seen by more people!
          </span>
        <div className="bg-white rounded-lg shadow-sm p-4">
         
          <TopPostsTable posts={data.topPosts} />
        </div>
      </div>
    </div>
  );
}