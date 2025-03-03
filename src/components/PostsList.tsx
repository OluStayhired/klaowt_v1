import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../auth';
import { Post } from '../types/post';
import { PostCard } from './PostCard';
import { EngagementBar } from './EngagementBar';
import { Loader2 } from 'lucide-react';
import { useCustomFeedPosts } from '../hooks/useCustomFeedPosts';
import { SearchBar } from './SearchBar';

const debugLog = (message: string, data?: any) => {
  console.log(`[Posts List] ${message}`, data ? JSON.stringify(data, null, 2) : '');
};


interface PostsListProps {
  feedUri: string;
  feedName: string;
  feedCategory?: string;
}

export function PostsList({ feedUri, feedName, feedCategory }: PostsListProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [engagedPosts, setEngagedPosts] = useState<Set<string>>(new Set());
  const { agent, user } = useAuthStore();
  const { posts: customPosts, loading: customLoading, error: customError } = useCustomFeedPosts(feedUri);
      //variables for making search work
  const [searchQuery, setSearchQuery] = useState('');
  //const [comments, setComments] = useState<any[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]); // New state

  const handlePostSearch = (query: string) => {
        setSearchQuery(query);
        if (!query) {
            setFilteredPosts(posts); // Reset to original posts if search is cleared
            return;
        }

        const filtered = posts.filter(post => {
            if (!post.record || !post.record.text) return false; // Handle posts without text

            const searchText = post.record.text.toLowerCase();
            const searchTerms = query.toLowerCase().split(/\s+/);
            return searchTerms.every(term => searchText.includes(term));
        });

        setFilteredPosts(filtered);
    };  

  const updatePost = (postUri: string, updates: Partial<Post>) => {
    setPosts(currentPosts => 
      currentPosts.map(post => 
        post.uri === postUri ? { ...post, ...updates } : post
      )
    );
    
    if (updates.isLiked || updates.replies) {
      setEngagedPosts(current => new Set([...current, postUri]));
    }
  };

  const addReplyToPost = (postUri: string, reply: Post) => {
    setPosts(currentPosts => 
      currentPosts.map(post => {
        if (post.uri === postUri) {
          const updatedReplies = post.replies ? [...post.replies, reply] : [reply];
          return {
            ...post,
            replyCount: post.replyCount + 1,
            replies: updatedReplies
          };
        }
        return post;
      })
    );
    setEngagedPosts(current => new Set([...current, postUri]));
  };

  useEffect(() => {
    let mounted = true;
    const batchSize = 10; // Process posts in batches of 10

    async function fetchPosts() {
      if (!agent || !user) return;

      try {
        setLoading(true);
        setError(null);
        setEngagedPosts(new Set());
        setPosts([]);

//check what's in the post API  
//console.log('Post Full Details - ',posts);
        
        debugLog('Starting posts fetch', { feedUri, feedCategory });

        // Handle custom feeds separately
        if (feedCategory === 'Custom') {
          if (mounted) {
            const engaged = new Set(
              customPosts
                .filter(post => post.replies?.some(reply => reply.author.did === user.did))
                .map(post => post.uri)
            );
            setEngagedPosts(engaged);
            setPosts(customPosts);
            setError(customError);
            setLoading(customLoading);
          }
          return;
        }

        let response;
        // Handle special feeds
        if (feedUri === 'following') {
          response = await agent.getTimeline({
            limit: 50,
          });
        } else {
          // For regular feeds, ensure proper AT-URI format
          let formattedUri = feedUri;
          
          if (!feedUri.startsWith('at://')) {
            const parts = feedUri.split('/');
            const did = parts.find(part => part.startsWith('did:'));
            const feedName = parts[parts.length - 1];
            
            if (!did || !feedName) {
              throw new Error('Invalid feed URI format');
            }
            
            formattedUri = `${did}/app.bsky.feed.generator/${feedName}`;
          }

          debugLog('Using formatted feed URI', { formattedUri });

          response = await agent.app.bsky.feed.getFeed({
            feed: formattedUri,
            limit: 50,
          });
        }

        if (!mounted) return;

        if (!response?.data?.feed) {
          throw new Error('Invalid feed response');
        }

        // Process posts in parallel batches
        const processedPosts = [];
        const engaged = new Set<string>();

        for (let i = 0; i < response.data.feed.length; i += batchSize) {
          const batch = response.data.feed.slice(i, i + batchSize);
          
          // Process batch in parallel
          const batchResults = await Promise.all(
            batch.map(async (item) => {
              if (!item?.post) return null;

              try {
                // Fetch thread and engagement info in parallel
                const [threadResponse, likesResponse] = await Promise.all([
                  agent.getPostThread({ uri: item.post.uri, depth: 1 }),
                  agent.getLikes({ uri: item.post.uri })
                ]);

                const userReplies = threadResponse.data.thread.replies?.filter(
                  (reply: any) => reply.post.author.did === user.did
                ).map((reply: any) => ({
                  uri: reply.post.uri,
                  cid: reply.post.cid,
                  author: reply.post.author,
                  record: reply.post.record,
                  replyCount: reply.post.replyCount || 0,
                  repostCount: reply.post.repostCount || 0,
                  likeCount: reply.post.likeCount || 0,
                  indexedAt: reply.post.indexedAt,
                }));

                const hasLiked = likesResponse.data.likes.some(
                  like => like.actor.did === user.did
                );

                const post = {
                  uri: item.post.uri,
                  cid: item.post.cid,
                  author: item.post.author,
                  record: item.post.record,
                  replyCount: item.post.replyCount || 0,
                  repostCount: item.post.repostCount || 0,
                  likeCount: item.post.likeCount || 0,
                  indexedAt: item.post.indexedAt,
                  isLiked: hasLiked,
                  replies: userReplies
                };

                if (userReplies?.length || hasLiked) {
                  engaged.add(post.uri);
                }

                return post;
              } catch (err) {
                console.warn('Error processing post:', err);
                return null;
              }
            })
          );

    processedPosts.push(...batchResults.filter((post): post is Post => post !== null));

          if (mounted) {
            setPosts(current => [...current, ...batchResults.filter((post): post is Post => post !== null)]);
            setEngagedPosts(engaged);
          }
        }

        if (mounted) {
          setError(null);
          // Initialize filteredPosts with fetched posts
          setFilteredPosts(processedPosts); // <--- Add this line
        }
      } catch (err: any) {
        console.error('Error fetching posts:', err);
        if (mounted) {
          let errorMessage = 'Failed to load posts. Please try again later.';
          if (err.status === 400) {
            errorMessage = 'This feed is currently unavailable.';
          }
          setError(errorMessage);
          setPosts([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchPosts();

    return () => {
      mounted = false;
    };
  }, [agent, feedUri, feedCategory, customPosts, customError, customLoading, user?.did]);

  if (loading || (feedCategory === 'Custom' && customLoading)) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error || (feedCategory === 'Custom' && customError)) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">{error || customError}</p>
      </div>
    );
  }

  {/* old EngagementBar 
  return (
    <div className="space-y-4">
      <EngagementBar 
        totalPosts={posts.length} 
        engagedPosts={engagedPosts.size}
        feedName={feedName}
      />
      {posts.map((post, index) => (
        <PostCard 
          key={`${post.uri}-${post.cid}-${index}`}
          post={post}
          isEngaged={engagedPosts.has(post.uri)}
          onReply={(reply) => addReplyToPost(post.uri, reply)}
          onUpdatePost={(updates) => updatePost(post.uri, updates)}
        />
      ))}
      {posts.length === 0 && (
        <p className="text-center text-gray-500 py-8">No posts found in this feed.</p>
      )}
    </div>
  );*/}
return (
        <div className="space-y-4">
            <div className="bg-white z-10"> 
                <EngagementBar
                    totalPosts={posts.length}
                    engagedPosts={engagedPosts.size}
                    feedName={feedName}
                />
            </div>
            <div className="text-sm rounded-lg shadow-md text-blue-500 sticky top-0 bg-white z-10"> 
             
                <SearchBar placeholder="Search for keywords in this feed" onSearch={handlePostSearch} />
            </div>
            {filteredPosts.map((post, index) => (
                <PostCard
                    key={`${post.uri}-${post.cid}-${index}`}
                    post={post}
                    isEngaged={engagedPosts.has(post.uri)}
                    onReply={(reply) => addReplyToPost(post.uri, reply)}
                    onUpdatePost={(updates) => updatePost(post.uri, updates)}
                />
            ))}
            {filteredPosts.length === 0 && (
                <p className="text-center text-gray-500 py-8">No posts found.</p>
            )}
        </div>
    );

  
}