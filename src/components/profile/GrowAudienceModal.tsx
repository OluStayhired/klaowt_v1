import React, { useState, useEffect } from 'react';
import { X, TrendingUp, Calendar, MessageCircle, Copy, Trash2, ArrowLeft, Sparkles, NotebookPen, BarChart2, SquarePen } from 'lucide-react';
import { Clock, Heart, Share2, Send } from 'lucide-react';
import { useAuthStore } from '../../auth';
import { createPortal } from 'react-dom';
import { useGemini } from "../../hooks/useGemini";
import { SearchBar } from '../SearchBar';


interface GrowAudienceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Screen = 'main' | 'planContent' | 'convert';

export function GrowAudienceModal({ isOpen, onClose }: GrowAudienceModalProps) {
  const [currentScreen, setCurrentScreen] = useState<Screen>('main');
  const [comments, setComments] = useState<any[]>([]);
  const [selectedComment, setSelectedComment] = useState<any>(null);
  const [convertedText, setConvertedText] = useState('');
  const { agent, user } = useAuthStore();
  const [hoveredComment, setHoveredComment] = useState<string | null>(null);
  const portalRoot = document.getElementById('portal-root') || document.body;
  const { loading, improveComment, turnCommentToPost } = useGemini();
  const [filter, setFilter] = useState<'all' | 'comments' | 'posts'>('all');
  const [searchQuery, setSearchQuery] = useState('');
   const [isPosting, setIsPosting] = useState(false);

const [notification, setNotification] = useState<{
  message: string;
  type: 'success' | 'error';
} | null>(null);

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

  const handleTurnCommentToPost = async () => {
    if (!selectedComment) return;
    const result = await turnCommentToPost(selectedComment.text);
    if (!result.error) {
      setConvertedText(result.text);
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
    setConvertedText(comment.text);
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

  const modal = (
    <div className="fixed inset-0 z-[1000000] overflow-hidden">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center space-x-2">
              {currentScreen !== 'main' && (
                <button
                  onClick={() => setCurrentScreen('main')}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-500" />
                </button>
              )}
              <h2 className="text-xl font-semibold">
                {currentScreen === 'main' ? 'Start your growth with Klaowt . . ' :
                 currentScreen === 'planContent' ? 'Browse Posts' :
                 'Create Post'}
              </h2>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
{/* Add notification here, before the Content section */}
{notification && (
  <div className={`mx-4 mt-4 p-3 rounded-lg ${
    notification.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
  }`}>
    {notification.message}
  </div>
)}
          
          {/* Content */}
          <div className="p-4 max-h-[calc(100vh-10rem)] overflow-y-auto">
            {currentScreen === 'main' && (
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
                <button onClick={onClose} className="p-6 border shadow-lg rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left">
                  <TrendingUp className="w-8 h-8 text-blue-500 mb-2" />
                  <h3 className="font-semibold mb-1">Boost Visibility 🦋 (Soon)</h3>
                  <p className="text-xs text-gray-600">
                    Discover relevant creators and engage with active friends to increase your reach.<span className="text-blue-500"> Coming Soon</span> 
                  </p>
                </button>
                {/*New Row Starts Here*/}
                {/*
            <button className="p-6 border shadow-lg rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all text-left">
                  <Calendar className="w-8 h-8 text-gray-400 mb-2" />
                  <h3 className="font-semibold text-gray-400 mb-1">Generate Ideas (soon)</h3>
                  <p className="text-xs text-gray-400">
                    Generate diverse and relevant content ideas that drive meaningful interactions.
                  </p>
                </button>

              <button className="p-6 border shadow-lg rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all text-left">
                  <BarChart2 className="w-8 h-8 text-gray-400 mb-2" />
                  <h3 className="font-semibold text-gray-400 mb-1">View Analytics (soon)</h3>
                  <p className="text-xs text-gray-400">
                    Measure your engagement, learn what posts bring people to your profile.
                  </p>
                </button>
                */}
              </div>
      
            )}

            {currentScreen === 'planContent' && (
              <div className="space-y-4">
                 <span className="text-xs text-blue-500">Create new posts from previous content</span>

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
                <SearchBar placeholder="Search for my recent posts " onSearch={handleSearch} />
                
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
                          <Sparkles className="w-4 h-4 mr-1" />
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
            )}

            {currentScreen === 'convert' && selectedComment && (
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
                    value={convertedText}
                    onChange={(e) => setConvertedText(e.target.value)}
                    maxLength={300}
                    rows={8}
                    className="w-full p-3 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    placeholder="Edit your post..."
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
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, portalRoot);
}
