import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../auth';
import { Post } from '../types/post';
import { UserPostCard } from './UserPostCard';
import { EngagementBar } from './EngagementBar';
import { Loader2 } from 'lucide-react';
import { SearchBar } from './SearchBar';

interface UserPostsListProps {
    userHandle: string;
    userName: string;
}

export function UserPostsList({ userHandle, userName }: UserPostsListProps) {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [engagedPosts, setEngagedPosts] = useState<Set<string>>(new Set());
    const { agent, user } = useAuthStore();
    //variables for making search work
  const [searchQuery, setSearchQuery] = useState('');
  //const [comments, setComments] = useState<any[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]); // New state

  const handleInteractionChange = (postUri: string, updates: {
        isLiked: boolean;
        isCommented: boolean;
        isReposted: boolean;
        likeCount: number;
        replyCount: number;
        repostCount: number;
    }) => {
        setPosts(currentPosts =>
            currentPosts.map(post => {
                if (post.uri === postUri) {
                    return {
                        ...post,
                        isLiked: updates.isLiked,
                        replyCount: updates.replyCount,
                        repostCount: updates.repostCount,
                        likeCount: updates.likeCount,
                        replies: updates.isCommented ? post.replies || [{}] : post.replies,
                    };
                }
                return post;
            })
        );
     // Update engaged posts set
  if (updates.isLiked || updates.isCommented || updates.isReposted) {
    setEngagedPosts(prev => new Set([...prev, postUri]));
  }
    };

  const handlePostSearch = (query: string) => {
        setSearchQuery(query);
        if (!query) {
            setFilteredPosts(posts); // Reset to original posts if search is cleared
            return;
        };

 
    
  const filtered = posts.filter(post => {
        if (!post.record || !post.record.text) return false; // Handle posts without text

            const searchText = post.record.text.toLowerCase();
            const searchTerms = query.toLowerCase().split(/\s+/);
            return searchTerms.every(term => searchText.includes(term));
        });

        setFilteredPosts(filtered);
    };  

    const fetchPosts = useCallback(async () => {

         let mounted = true;

      if (!agent || !user) return;
      try {
        setLoading(true);
        setError(null);
         // Get user's posts

        const response = await agent.getAuthorFeed({
          actor: userHandle,
          limit: 50,
          filter: 'posts_no_replies'
        });

        // Process posts in parallel
        const processedPosts = await Promise.all(
          response.data.feed.map(async (item) => {
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
                setEngagedPosts(prev => new Set([...prev, post.uri]));
              }

              return post;
            } catch (err) {
              console.warn('Error processing post:', err);
              return null;
            }
          })

        );

        if (mounted) {
          const validPosts = processedPosts.filter((post): post is Post => post !== null);
          setPosts(validPosts);
          setFilteredPosts(validPosts); // Initialize filteredPosts with original posts
          setError(null);
        }
      } catch (err) {
            console.error('Error fetching posts:', err);
            setError('Failed to load posts');
        } finally {
            setLoading(false);
        }
        if (!mounted) return;
        // ... (your fetchPosts logic)
    }, [agent, user, userHandle]);

    // Move updatePost and addReplyToPost outside useEffect
    const updatePost = (postUri: string, updates: {
        isLiked: boolean;
        isCommented: boolean;
        isReposted: boolean;
        likeCount: number;
        replyCount: number;
        repostCount: number;
    }) => {
        setPosts(currentPosts =>
            currentPosts.map(post =>
                post.uri === postUri ? { ...post, ...updates } : post
            )
        );
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
    fetchPosts();

    return () => {
        // Cleanup logic (if any)
          };
      }, [fetchPosts]);

    if (loading) {
        return (
            <div className="flex justify-center items-center py-8">
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8">
                <p className="text-red-500">{error}</p>
            </div>
        );
    }

   return (
        <div className="space-y-4">
            <div className="bg-white z-10"> {/* Sticky EngagementBar sticky top-0 */}
                <EngagementBar
                    totalPosts={posts.length}
                    engagedPosts={engagedPosts.size}
                    feedName={userName}
                />
            </div>
            <div className="text-sm rounded-lg shadow-md text-blue-500 sticky top-0 bg-white z-10"> 
              {/*"sticky top-[70px] bg-white z-10"> Sticky SearchBar */}
                <SearchBar placeholder="Search for keywords in this feed" onSearch={handlePostSearch} />
            </div>
            {filteredPosts.map((post, index) => (
                <UserPostCard
                    key={`${post.uri}-${post.cid}-${index}`}
                    post={post}
                    isEngaged={engagedPosts.has(post.uri)}
                    onReply={(reply) => addReplyToPost(post.uri, reply)}
                    onUpdatePost={(updates) => updatePost(post.uri, updates)}
                    handleInteractionChange={handleInteractionChange} 
                />
            ))}
            {filteredPosts.length === 0 && (
        <p className="text-center text-gray-500 py-8">No posts found.</p>
            )}
        </div>
    );
}