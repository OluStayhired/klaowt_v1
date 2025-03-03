import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, TrendingUp, MessageCircle, Copy, Trash2, ArrowLeft, Sparkles, NotebookPen, 
  Users, UserCheck, Megaphone, Radio, Trophy, UserPlus, MessagesSquare, Bell,
  UserRoundCheck, Flame, Crown, PinIcon, ChevronDown, ChevronUp, ChevronRight, ChevronLeft, Loader2, Video, CheckCircle
} from 'lucide-react';
import { Clock, Heart, Share2, Send } from 'lucide-react';
import { CheckCheck } from 'lucide-react';
import { VolumeX } from 'lucide-react';
import { useAuthStore } from '../../auth';
import { useGemini } from "../../hooks/useGemini";
import { SearchBar } from '../SearchBar';
import { PostsList } from '../PostsList';
import { Feed } from '../../types/feed';
import { InsightsPanel } from '../analytics/InsightsPanel';
import { TopPostsTable } from '../analytics/TopPostsTable';
import { ContributorsTable } from '../analytics/ContributorsTable';
import { usePopularFeeds } from '../../hooks/usePopularFeeds';
import { QuickTourFocused } from './QuickTourFocused';
import { BlueskyTimer } from './BlueskyTimer';
//import { EngageTimer } from './EngageTimer_1';
//import { FloatingEngageTimer } from './FloatingEngageTimer';
//import { EngageTimer } from './EngageTimer';
//import { TourGuideModal } from './TourGuideModal';

interface GrowAudienceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Screen = 'main' | 'planContent' | 'convert' | 'engagement' | 'feed-view' | 'contributors';

interface AccordionSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  subsections: {
    id: string;
    title: string;
    icon: React.ReactNode;
    description: string;
  }[];
}

export function GrowAudienceModal({ isOpen, onClose }: GrowAudienceModalProps) {
  const [currentScreen, setCurrentScreen] = useState<Screen>('main');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [selectedSubsection, setSelectedSubsection] = useState<string | null>(null);
  const [selectedFeed, setSelectedFeed] = useState<Feed | null>(null);
  const { feeds, refetchFeeds } = usePopularFeeds();
  const { agent, user } = useAuthStore();
  const [showTour, setShowTour] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  

    // Add useEffect here to initialize usePopularFeeds
  useEffect(() => {
    if (agent) {
      refetchFeeds();
    }
  }, [agent, refetchFeeds]);

  useEffect(() => {
  console.log('showNotification state changed:', showNotification);
}, [showNotification]);

  // Keep existing state variables... .
  const [comments, setComments] = useState<any[]>([]);
  const [selectedComment, setSelectedComment] = useState<any>(null);
  const [convertedText, setConvertedText] = useState('');
  const [loading, setLoading] = useState();
  const [hoveredComment, setHoveredComment] = useState<string | null>(null);
  const portalRoot = document.getElementById('portal-root') || document.body;
  const { improveComment, turnCommentToPost } = useGemini();
  const [filter, setFilter] = useState<'all' | 'comments' | 'posts'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [topPosts, setTopPosts] = useState<Post[]>([]);
  const [contributors, setContributors] = useState<ContributorStats[]>([]);
  const [previousScreen, setPreviousScreen] = useState<Screen | null>(null);
  const [showQuickTour, setShowQuickTour] = useState(false);
  const [previousScreenBeforeTour, setPreviousScreenBeforeTour] = useState<Screen | null>(null);

const [notification, setNotification] = useState<{
  message: string;
  type: 'success' | 'error';
} | null>(null);

  const handleShowNotification = useCallback(() => {
  //console.log('handleShowNotification called');
  //console.log('Previous showNotification state:', showNotification);
  setShowNotification(true);
  //console.log('Setting showNotification to true');
  setTimeout(() => {
  //console.log('Timeout triggered, setting showNotification to false');
    setShowNotification(false);
  }, 5000);
}, []);

  const onTimeUp = useCallback(() => {
    // Handle time up logic if needed
  }, []);

    const onTimeUpdate = useCallback((remainingSeconds: number) => {
    // Handle time update logic if needed
  }, []);

  // Add z-index management
const notificationStyles = {
  position: 'fixed',
  top: '4rem', // 16 in tailwind
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 1000002, // Higher than modal's z-index
  display: 'flex',
  justifyContent: 'right', // Center horizontally
  alignItems: 'right',
};
  
  const handleSuccessfulPost = () => {
  // Show success notification
  setNotification({
    message: 'Post created successfully! 🎉',
    type: 'success'
  });

  // Clear the converted text
  setConvertedText('');
  
  // Clear notification after 3 seconds
  setTimeout(() => {
    setNotification(null);
  }, 3000);
};

  
  // Extract the fetch logic into a reusable function
const fetchComments = async () => {
  if (!agent || !user) return;
  try {
    const response = await agent.getAuthorFeed({
      actor: user.handle,
      limit: 50
    });
 const userComments = response.data.feed
        .map(item => ({
          text: item.post.record.text,
          uri: item.post.uri,
          indexedAt: item.post.indexedAt,
          replyCount: item.post.replyCount,
          repostCount: item.post.repostCount,
          likeCount: item.post.likeCount,
          isReply: !!item.reply, 
          // Use item.reply to determine if it's a comment

          // Add user profile information
          author: {
            avatar: user.avatar,
            displayName: user.displayName || user.handle,
            handle: user.handle
          }
          
        }))
        .filter(item => {
          switch (filter) {
            case 'comments':
              return item.isReply; // Show only replies/comments
            case 'posts':
              return !item.isReply; // Show only posts (non-replies)
            default: // 'all'
              return true; // Show everything
          }
        })
        .slice(0, 50);
        setComments(userComments);
      } catch (err) {
        console.error('Error fetching comments:', err);
      }
    }; 

//end - missing sections after adding engagement section  
  
  const engagementSections: AccordionSection[] = [
    {
      id: 'friends',
      title: <span>Connect with Friends <span className = "text-left text-gray-500 font-normal">20mins</span></span>,
      icon: <Users className="w-5 h-5 text-blue-500" />,
      subsections: [
        {
          id: 'active-posters',
          title: 'Engage with Active Posters',
          icon: <Megaphone className="w-4 h-4" />,
          description: 'Connect with friends who are actively posting right now'
        },
        {
          id: 'recent-mentions',
          title: 'Respond to Recent Mentions',
          icon: <Bell className="w-4 h-4" />,
          description: 'Respond to friends who have mentioned you recently'
        },
        {
          id: 'popular-with-friends',
          title: 'Comment on Popular Posts',
          icon: <UserRoundCheck className="w-4 h-4" />,
          description: 'Engage with popular posts your friends already liked'
        }
      ]
    },
    {
      id: 'trending',
      title: <span>Engage with Trending Posts <span className = "text-left text-gray-500 font-normal">15mins</span></span>,
      icon: <Flame className="w-5 h-5 text-blue-500" />,
      subsections: [
        {
          id: 'friends-posts',
          title: 'Respond to Trending Posts from Friends',
          icon: <MessagesSquare className="w-4 h-4" />,
          description: 'Engage with trending posts from your network'
        },
        {
          id: 'creator-posts',
          title: 'Engage with Trending Posts from Creators',
          icon: <Radio className="w-4 h-4" />,
          description: 'Join conversations on viral posts your friends liked'
        }
      ]
    },
    {
      id: 'creators',
      title: <span>Follow Relevant Creators <span className = "text-left text-gray-500 font-normal">10mins</span></span>,      
      icon: <Crown className="w-5 h-5 text-blue-500" />,
      subsections: [
        {
          id: 'league-table',
          title: 'Track & Follow top Creators',
          icon: <PinIcon className="w-4 h-4" />,
          description: 'Track and engage with the top creators in your niche'
        }
      ]
    }
  ];

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);
  
// Update the useEffect to use the new fetchComments function
useEffect(() => {
  if (isOpen) {
    fetchComments();
  }
}, [agent, user, isOpen, filter]);


useEffect(() => {
  // Clear data when leaving contributors screen
  if (currentScreen !== 'contributors') {
    setContributors([]);
  }
}, [currentScreen]);

  
 // const handleTurnCommentToPost = async () => {
 //   if (!selectedComment) return;
 //   const result = await turnCommentToPost(selectedComment.text);
  //  if (!result.error) {
  //    setConvertedText(result.text);
  //  }
  //};

 const handleTurnCommentToPost = async () => {
  if (!selectedComment) return;
  
  try {
    setLoading(true); // Add loading state
    const result = await turnCommentToPost(selectedComment.text);
    
    if (!result.error) {
      // Directly update the state instead of dispatching an event
      setConvertedText(result.text);
    } else {
      // Handle error case
      setNotification({
        message: 'Failed to generate post. Please try again.',
        type: 'error'
      });
    }
  } catch (err) {
    console.error('Error generating post:', err);
    setNotification({
      message: 'An error occurred while generating the post.',
      type: 'error'
    });
  } finally {
    setLoading(false); // Clear loading state
  }
};



 // Add the search handler function
const handleSearch = (query: string) => {
  setSearchQuery(query);
if (!agent || !user) return;
  
  // Filter the existing comments based on search query
  const filteredComments = comments.filter(comment => {
  const searchText = comment.text.toLowerCase();
  const searchTerms = query.toLowerCase().split(/\s+/);
    
    // Match all search terms (AND search)
    return searchTerms.every(term => searchText.includes(term));
  });
  
   setComments(filteredComments);
  
  // If search is cleared, re-fetch original comments
  if (!query) {
    fetchComments(); // You'll need to extract the fetch logic into a named function
  }
};

//end new lines to handle search function

 
  const handleConvert = (comment: any) => {
    setSelectedComment(comment);
    setConvertedText('');
    setCurrentScreen('convert');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(convertedText);
  };

  const handleClear = () => {
    setConvertedText('');
  };

const handlePost = async () => {
  if (!agent || !convertedText.trim() || convertedText.length > 300) return;

  try {
    setIsPosting(true);
    
    await agent.post({
      text: convertedText.trim(),
      createdAt: new Date().toISOString(),
      langs: ['en'],
    });

    handleSuccessfulPost();
  } catch (err) {
    console.error('Error creating post:', err);
    setNotification({
      message: 'Failed to create post. Please try again.',
      type: 'error'
    });
  } finally {
    setIsPosting(false);
  }
};


  const formatTime = (time: string) => {
    const now = new Date();
    const postDate = new Date(time);
    const diffInHours = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60 * 60));
    return diffInHours >= 24 ? `${Math.floor(diffInHours / 24)}d` : `${diffInHours}h`;
  };

  if (!isOpen) return null;

  // ... rest of the existing state variables - done

  const handleSectionClick = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
    setSelectedSubsection(null);
  };

const handleSubsectionClick = async (subsectionId: string) => {
  setSelectedSubsection(subsectionId);
  
  if (subsectionId === 'active-posters') {
    // Show loading state while finding the feed
    setLoading(true);
    
    if (feeds?.mutuals) {
      // Transform the feed data to include all required properties
      const mutualsFeed: Feed = {
        uri: feeds.mutuals.uri,
        cid: feeds.mutuals.cid,
        creator: feeds.mutuals.creator,
        displayName: feeds.mutuals.displayName,
        description: feeds.mutuals.description || 'Posts from your mutual followers',
        avatar: feeds.mutuals.avatar,
        likeCount: feeds.mutuals.likeCount || 0,
        subscriberCount: feeds.mutuals.viewerCount || 0,
        category: 'Social'
      };
      
      setSelectedFeed(mutualsFeed);
      setCurrentScreen('feed-view');
    }
    setLoading(false);
  };
 
  // popular feed:
  if (subsectionId === 'popular-with-friends') {
    // Show loading state while finding the feed
    setLoading(true);
    
    if (feeds?.popular) {
      // Transform the feed data to include all required properties
      const popularFeed: Feed = {
        uri: feeds.popular.uri,
        cid: feeds.popular.cid,
        creator: feeds.popular.creator,
        displayName: feeds.popular.displayName,
        description: feeds.popular.description || 'Engage with popular content your friends and their followers liked',
        avatar: feeds.popular.avatar,
        likeCount: feeds.popular.likeCount || 0,
        subscriberCount: feeds.popular.viewerCount || 0,
        category: 'Social'
      };
      
      setSelectedFeed(popularFeed);
      setCurrentScreen('feed-view');
    }
    setLoading(false);
  };
    // recent mentions feed:
  if (subsectionId === 'recent-mentions') {
    // Show loading state while finding the feed
    setLoading(true);
    
    if (feeds?.mentions) {
      // Transform the feed data to include all required properties
      const mentionsFeed: Feed = {
        uri: feeds.mentions.uri,
        cid: feeds.mentions.cid,
        creator: feeds.mentions.creator,
        displayName: feeds.mentions.displayName,
        description: feeds.mentions.description || 'Engage with content where your friends have mentioned you',
        avatar: feeds.mentions.avatar,
        likeCount: feeds.mentions.likeCount || 0,
        subscriberCount: feeds.mentions.viewerCount || 0,
        category: 'Social'
      };
      
      setSelectedFeed(mentionsFeed);
      setCurrentScreen('feed-view');
    }
    setLoading(false);
  }

// friends-posts TopPostsTable  
if (subsectionId === 'friends-posts') {
    setLoading(true);
    
    try {
      if (feeds?.mutuals) {
        // Fetch posts from mutuals feed
        const response = await agent?.app.bsky.feed.getFeed({
          feed: feeds.mutuals.uri,
          limit: 50
        });

        // Transform posts to required format
        const posts = response.data.feed.map(item => ({
          uri: item.post.uri,
          cid: item.post.cid,
          author: item.post.author,
          record: item.post.record,
          replyCount: item.post.replyCount || 0,
          repostCount: item.post.repostCount || 0,
          likeCount: item.post.likeCount || 0,
          indexedAt: item.post.indexedAt
        }));

        setTopPosts(posts);
        setCurrentScreen('top-posts');
      }
    } catch (err) {
      console.error('Error fetching mutual posts:', err);
    } finally {
      setLoading(false);
    }
  } 

// creator posts - TopPostsTable
if (subsectionId === 'creator-posts') {
    setLoading(true);
    
    try {
      if (feeds?.popular) {
        // Fetch posts from popular feed
        const response = await agent?.app.bsky.feed.getFeed({
          feed: feeds.popular.uri,
          limit: 50
        });

        // Transform posts to required format
        const posts = response.data.feed.map(item => ({
          uri: item.post.uri,
          cid: item.post.cid,
          author: item.post.author,
          record: item.post.record,
          replyCount: item.post.replyCount || 0,
          repostCount: item.post.repostCount || 0,
          likeCount: item.post.likeCount || 0,
          indexedAt: item.post.indexedAt
        }));

        setTopPosts(posts);
        setCurrentScreen('top-posts');
      }
    } catch (err) {
      console.error('Error fetching creator posts:', err);
    } finally {
      setLoading(false);
    }
}
 // Start - Contributors League Table (Popular Friends) 

if (subsectionId === 'league-table') {
  setLoading(true);
  // Store the previous screen state
  setPreviousScreen('engagement');
  setCurrentScreen('contributors');
  
  try {
    if (feeds?.popular) {
      // Fetch posts from popular feed to analyze contributors
      const response = await agent?.app.bsky.feed.getFeed({
        feed: feeds.popular.uri,
        limit: 100
      });

      // Process contributors from posts
      const contributorStats = new Map();
      
      response.data.feed.forEach(item => {
        const author = item.post.author;
        const stats = contributorStats.get(author.did) || {
          did: author.did,
          handle: author.handle,
          displayName: author.displayName,
          avatar: author.avatar,
          stats: {
            posts: { last24h: 0, last3d: 0, last7d: 0 },
            likes: { last24h: 0, last3d: 0, last7d: 0 },
            shares: { last24h: 0, last3d: 0, last7d: 0 },
            comments: { last24h: 0, last3d: 0, last7d: 0 }
          }
        };

        // Update stats based on post metrics
        stats.stats.posts.last7d++;
        stats.stats.likes.last7d += item.post.likeCount || 0;
        stats.stats.shares.last7d += item.post.repostCount || 0;
        stats.stats.comments.last7d += item.post.replyCount || 0;

        contributorStats.set(author.did, stats);
      });

      // Convert to array and sort by engagement
      const contributors = Array.from(contributorStats.values())
        .sort((a, b) => 
          (b.stats.likes.last7d + b.stats.shares.last7d + b.stats.comments.last7d) -
          (a.stats.likes.last7d + a.stats.shares.last7d + a.stats.comments.last7d)
        );

      setContributors(contributors);
      setCurrentScreen('contributors');
    }
  } catch (err) {
    console.error('Error fetching contributor stats:', err);
  } finally {
    setLoading(false);
  }
}


 // End - Contributors League Table (Popular Friends) 
};


// Keep existing renderPlanContent and renderConvertPosts functions...
//start create renderPlanContent function . . .
const renderPlanContent = () => (
              <div className="space-y-4">
                <div className="mb-6">
                        <h3 className="text-sm font-semibold text-blue-500 mb-2">Turn your old content into brand new posts 💡</h3>
                 <p className="text-xs text-gray-600">Instantly create new posts from previous content</p>
                </div>
                
                {/*Start add Categories*/}
<div className="flex space-x-2 mb-4">
      <button
        onClick={() => setFilter('all')}
        className={`px-3 py-1.5 rounded-full text-xs ${
          filter === 'all'
            ? 'bg-blue-500 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        All
      </button>
      <button
        onClick={() => setFilter('comments')}
        className={`px-3 py-1.5 rounded-full text-xs ${
          filter === 'comments'
            ? 'bg-blue-500 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        Comments
      </button>
      <button
        onClick={() => setFilter('posts')}
        className={`px-3 py-1.5 rounded-full text-xs ${
          filter === 'posts'
            ? 'bg-blue-500 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        Posts
      </button>
    </div>


    <div className="text-sm rounded-lg shadow-md text-blue-500 sticky top-0 bg-white z-10"> 
                <SearchBar placeholder="Search for my recent posts " onSearch={handleSearch} />
    </div>                
                
                {/*End add Categories*/}
                {comments.map((comment) => (
                  <div
                    key={comment.uri}
                    className="bg-white rounded-lg shadow-sm border border-gray-100 hover:border-blue-100 hover:shadow-lg transition-all p-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        {/*Start Add User Avatar */}
<div className="flex items-start space-x-3">
    {/* Add user avatar */}
    <img
      src={comment.author.avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100&h=100&fit=crop'} 
      alt={comment.author.displayName}
      className="w-8 h-8 rounded-full object-cover"
    />

                        {/*End Add user Avatar*/}
                        <div className="flex-1">
                          {/* Start Add user name and handle */}
                          <div className="flex flex-col">
                                <span className="text-sm font-medium">{comment.author.displayName}</span>
                                <span className="text-xs text-gray-500 mb-3">@{comment.author.handle}</span>
                          </div>
                            {/*End Add username and handle*/}
                          <p className="text-xs text-gray-800 whitespace-pre-wrap">
                            {comment.text}
                          </p>
                        </div>
</div> {/*div close for user avatar*/}
                        <button
                          onClick={() => handleConvert(comment)}
                          className="ml-4 flex items-center px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors"
                        >
                          <NotebookPen className="w-4 h-4 mr-1" />
                          <span className="text-xs">Create</span>
                        </button>
                      </div>

                      <div className="flex items-center px-10 space-x-6 pt-2 text-gray-500 border-t border-gray-50">
                        <div className="flex items-center space-x-1">
                          <Heart className="w-3.5 h-3.5" />
                          <span className="text-xs">{comment.likeCount}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Share2 className="w-3.5 h-3.5" />
                          <span className="text-xs">{comment.repostCount}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span className="text-xs">{comment.replyCount}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="text-xs">{formatTime(comment.indexedAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
//end create renderPlanContent function  

// start - renderConvertPosts function  const renderEngagementBuilder = () => (
const renderConvertPosts = () => (
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-500 mb-2">Original Content</h4>
                  <p className="text-xs text-blue-500">{selectedComment.text}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <button 
                      onClick={handleTurnCommentToPost}
                      className="inline-flex items-center px-3 py-1.5 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                    >
                      <Sparkles className="w-4 h-4 mr-1" />
                      <span className="text-xs">{loading ? 'Generating...' : 'Generate Post'}</span>
                    </button>
                  </div>

                  <textarea
                  //key={selectedComment?.uri || 'empty'} 
                    // Add key to force re-render
                    //defaultValue=""
                    value={convertedText}
                    onChange={(e) => setConvertedText(e.target.value)}
                    maxLength={300}
                    rows={8}
                    className="w-full p-3 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    placeholder="Turn your original comment into a brand new post..."
                  />

                  <div className="flex justify-between items-center">
                    <span className={`text-xs ${convertedText.length > 300 ? 'text-red-500' : 'text-gray-500'}`}>
                      {300 - convertedText.length} characters remaining
                    </span>
                    <div className="space-x-2">
                      <button
                        onClick={handleClear}
                        className="inline-flex items-center px-3 py-1.5 text-gray-600 hover:text-gray-800"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        <span className="text-xs">Clear</span>
                      </button>
                      <button
                        onClick={handleCopy}
                        className="inline-flex items-center px-3 py-1.5 text-blue-600 hover:text-blue-800"
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        <span className="text-xs">Copy</span>
                      </button>
                      <button
                        onClick={handlePost}
                        className="inline-flex items-center px-3 py-1.5 text-blue-600 hover:text-blue-800"
                      >
                        <Send className="w-4 h-4 mr-1" />
                        <span className="text-xs">Post</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
// end - renderConvertPosts function 
// end Keep existing renderPlanContent and renderConverPosts functions...

// Start renderFeedView
const renderFeedView = () => {
  if (loading) {
    return <div className="flex justify-center py-8">
      <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
    </div>;
  }

  if (!selectedFeed) {
    return <div>No feed selected</div>;
  }
    
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            {/* Show feed avatar with fallback */}
            <img
              src={selectedFeed.avatar || selectedFeed.creator.avatar}
              alt={selectedFeed.displayName}
              className="w-10 h-10 rounded"
            />
            <div>
              <h3 className="font-medium text-gray-900">{selectedFeed.displayName}</h3>
              <p className="text-sm text-gray-500">
                {selectedFeed.description || `Posts from ${selectedFeed.creator.displayName || selectedFeed.creator.handle}`}
              </p>
               <BlueskyTimer
                  initialMinutes={20}
                  showControls={true}
                  autoStart={true}
                  onTimeUp={onTimeUp} // Pass memoized callbacks
                  onTimeUpdate={onTimeUpdate} // Pass memoized callbacks
                  onShowNotification={handleShowNotification} 
                />
            </div>
          </div>
        </div>
        
        {/* Use PostsList to display feed content */}
        <PostsList
          feedUri={selectedFeed.uri}
          feedName={selectedFeed.displayName}
          feedCategory={selectedFeed.category}
        />
      </div>
    </div>
  );
};


// End renderFeedView  

  

  // Keep existing renderEngagementBuilder function...
// start renderEngagementBuilder function
  const renderEngagementBuilder = () => (
    <div className="space-y-4">
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-blue-500 mb-2">Get Your Daily Engagement Plan 👈</h3>
        <p className="text-xs text-gray-600">Follow this daily plan to build organic engagement on Bluesky</p>
      </div>

      <div className="space-y-4">
        {engagementSections.map((section) => (
          <div key={section.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
            <button
              onClick={() => handleSectionClick(section.id)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                {section.icon}
                <span className="font-medium text-gray-900">{section.title}</span>
              </div>
              <div className={`transform transition-transform ${
                expandedSection === section.id ? 'rotate-180' : ''
              }`}>
                <ChevronDown className="w-5 h-5 text-gray-400 duration-500" />
              </div>
            </button>

            <div className={`transition-all duration-300 ease-in-out ${
              expandedSection === section.id ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
            } overflow-hidden`}>
              <div className="p-4 bg-gray-50 space-y-2">
                {section.subsections.map((subsection) => (
                  <button
                    key={subsection.id}
                    onClick={() => handleSubsectionClick(subsection.id)}
                    className={`w-full p-4 rounded-lg text-left transition-all ${
                      selectedSubsection === subsection.id
                        ? 'bg-blue-50 border-blue-200 shadow-sm'
                        : 'bg-white hover:bg-gray-50 border border-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg text-blue-500 ${
                          selectedSubsection === subsection.id
                            ? 'bg-blue-100'
                            : 'bg-blue-50' //default
                        }`}>
                          {subsection.icon}
                        </div>
                        <div>
                          <h4 className="font-medium text-sm text-blue-500">{subsection.title}</h4>
                          <p className="text-xs text-gray-500">{subsection.description}</p>
                        </div>
                      </div>
                      <CheckCircle className={`w-5 h-5 text-blue-300 transition-transform ${
                        selectedSubsection === subsection.id ? '' : ''
                      }`} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
// end - renderEngagementBuilder function

// start - render TopPostsTable
const renderTopPosts = () => {
  if (loading) {
    return <div className="flex justify-center py-8">
      <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
    </div>;
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-sm p-4 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <img
            src={feeds?.mutuals?.avatar || feeds?.mutuals?.creator.avatar}
            alt="Mutual Friends"
            className="w-10 h-10 rounded"
          />
          <div>
            {/*<h3 className="font-medium text-gray-900">Trending Posts from Friends</h3>
            <p className="text-sm text-gray-500">
              Engage with the most popular posts from your mutual followers
            </p> */}
            <h3 className="font-medium text-gray-900">
              {selectedSubsection === 'friends-post' ? 
                'Trending Posts from Creators' : 
                'Trending Posts from Friends'}
            </h3>
            <p className="text-sm text-gray-500">
              {selectedSubsection === 'friends-post' ?
                'Engage with viral posts from top creators in your niche'
                :'Engage with popular posts from your mutual followers'}
            </p>
             <BlueskyTimer
                  initialMinutes={15}
                  showControls={true}
                  autoStart={true}
                  onTimeUp={onTimeUp} // Pass memoized callbacks
                  onTimeUpdate={onTimeUpdate} // Pass memoized callbacks
                  onShowNotification={handleShowNotification} 
                />
          </div>
        </div>
      </div>

      <TopPostsTable 
        posts={topPosts}
        onClose={() => {
          setCurrentScreen('engagement');
          setTopPosts([]);
        }}
      />
    </div>
  );
};

// end - render TopPostsTable  Mutual Friends

// start - render TopPostsTable Popular-With-Friends  
const renderPopularTopPosts = () => {
  if (loading) {
    return <div className="flex justify-center py-8">
      <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
    </div>;
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-sm p-4 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <img
            src={feeds?.popular?.avatar || feeds?.popular?.creator.avatar}
            alt="Popular Posts"
            className="w-10 h-10 rounded"
          />
          <div>
            <h3 className="font-medium text-gray-900">
              {selectedSubsection === 'creator-posts' ? 
                'Trending Posts from Creators' : 
                'Trending Posts from Friends'}
            </h3>
            <p className="text-sm text-gray-500">
              {selectedSubsection === 'creator-posts' ?
                'Engage with viral posts from top creators in your niche'
                :'Engage with popular posts from top creators'
              }
            </p>

          </div>
        </div>
      </div>

      <TopPostsTable 
        posts={topPosts}
        onClose={() => {
          setCurrentScreen('engagement');
          setTopPosts([]);
        }}
      />
    </div>
  );
};

// end - render TopPostsTable Popular-with-Friends  

// start - render Contributors League Table (Popular With Friends)
const renderContributors = () => {
  if (loading) {
    return <div className="flex justify-center py-8">
      <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
    </div>;
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-sm p-4 border-b border-gray-100">
        <div className="flex items-center space-x-3 top-0 left-0 right-0 z-[1000001]">
          <Trophy className="w-10 h-10 text-blue-500" />
          <div>
            <h3 className="font-medium text-gray-900">Top Contributors</h3>
            <p className="text-sm text-gray-500">
              Track and Follow the most popular creators with your friends
            </p>
              <BlueskyTimer
                  initialMinutes={10}
                  showControls={true}
                  autoStart={true}
                  onTimeUp={onTimeUp} // Pass memoized callbacks
                  onTimeUpdate={onTimeUpdate} // Pass memoized callbacks
                  onShowNotification={handleShowNotification} 
                />
          </div>
        </div>
      </div>

      <ContributorsTable 
        contributors={contributors}
        onClose={() => {
          setCurrentScreen('engagement');
          setContributors([]);
        }}
      />
    </div>
  );
};


// end - render Contributors League Table (Popular With Friends)  
  

  // End Keep existing renderEngagementBuilder function . . .
  const modal = (
    <div className="fixed inset-0 z-[1000000] overflow-hidden">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      {/* Notification placement is now controlled here */}
      {showNotification && (
//console.log('Rendering notification component:', { showNotification }),   
      <div 
        style={notificationStyles}
        
        className="bg-red-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center space-x-2 animate-bounce">
          <Bell className="w-4 h-4" />
          <span className="text-sm whitespace-nowrap">5 minutes remaining!</span>
        </div>
      )}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">

            <div className="flex items-center space-x-2">
              {currentScreen !== 'main' && (
                <button
                  onClick={() => {
                      if (currentScreen === 'feed-view') {
                          setCurrentScreen('engagement');
                          setSelectedFeed(null);
                        } else if (currentScreen === 'convert') {
                          setCurrentScreen('planContent');
                          setSelectedFeed(null);
                        } else if (currentScreen === 'contributors') {
                          setCurrentScreen(previousScreen || 'engagement');
                          setContributors([]);
                          setSelectedFeed(null);
                          setPreviousScreen(null); // Clear Previous Screen
                        } else if (currentScreen === 'top-posts') {
      // Clear top posts data and return to engagement screen
                          setCurrentScreen('engagement');
                          setTopPosts([]);
                          setSelectedSubsection(null);
                        } else {
                          setCurrentScreen('main');
                        }
  }}
  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
>
  <ArrowLeft className="w-5 h-5 text-gray-500" />
</button>
              )}
              <h2 className="text-xl font-semibold">
                {currentScreen === 'main' ? 'Start your growth with Klaowt . . ' :
                 currentScreen === 'planContent' ? 'Browse Posts' : 
                 currentScreen === 'engagement' ? 'Build Engagement' :
                 currentScreen === 'contributors' ? 'Follow Top Creators' : 
                 currentScreen === 'top-posts' ? 
                     selectedSubsection === 'creator-posts' ? 
                         'Trending Posts from Creators' : 
                         'Trending Posts from Friends' : 
                 currentScreen === 'feed-view' ? 'Engage With Friends' :
                 'Create Post'}
              </h2>
              {/* Add Button Here */}

            </div>
            <span className="flex">
              <span>
                  <button 
                      onClick={() => {
                        setPreviousScreenBeforeTour(currentScreen);
                        setShowQuickTour(true);
                      }}

                  className="px-2 py-1 mr-1 items-right text-sm bg-blue-500 text-white hover:bg-blue-600 rounded transition-colors flex items-center">
              <Video className="w-5 h-5 font-normal mr-2" /> 
                <p className="font-normal">Quick Guide</p> 
                    </button>
            </span>
            <span>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </span>  
          </span>    
          </div>

          {/* Content */}
          <div className="p-4 max-h-[calc(100vh-10rem)] overflow-y-auto">
            {/*Start Quick Tour Logic*/}
  {showQuickTour ? (
    <QuickTourFocused 
      onClose={() => {
        setShowQuickTour(false);
        if (previousScreenBeforeTour) {
          setCurrentScreen(previousScreenBeforeTour);
          setPreviousScreenBeforeTour(null);
        }
      }}
    />
  ) : currentScreen === 'main' ? (
              // Start Keep existing main screen JSX...
            <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setCurrentScreen('planContent')}
                  className="p-6 border shadow-lg rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                >
                  <NotebookPen className="w-8 h-8 text-blue-500 mb-2" />
                  <h3 className="font-semibold mb-1">Create Content ✍️</h3>
                  <p className="text-xs text-gray-600">
                    Struggling for ideas, turn your existing comments & posts into engaging content.<span className="text-blue-500"> Click to Start</span>.  
                  </p>
                </button>
                <button 
                  onClick={() => setCurrentScreen('engagement')}
                  className="p-6 border shadow-lg rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                >
                  <TrendingUp className="w-8 h-8 text-blue-500 mb-2" />
                  <h3 className="font-semibold mb-1">Build Engagement 🦋</h3>
                  <p className="text-xs text-gray-600">
                    Get your daily engagement plan. Create the daily habit to grow your audience.<span className="text-blue-500"> Click to Start</span>
                  </p>
                </button>
              </div>
      // End Keep esisting main screen JSX...
            ) : currentScreen === 'engagement' ? (
              renderEngagementBuilder()
            ) : currentScreen === 'planContent' ? (
              renderPlanContent()
            ) : currentScreen === 'convert' ? (
              renderConvertPosts()
            ) : currentScreen === 'feed-view' ? (
              renderFeedView()
            ) : currentScreen === 'top-posts' ? (
              renderTopPosts()
            ) : currentScreen === 'contributors' ? (
              renderContributors()
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
  return createPortal(modal, portalRoot);
}