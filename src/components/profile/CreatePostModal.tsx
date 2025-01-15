import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Image, Link2, Send, Loader2, SquarePen } from 'lucide-react';
import { useAuthStore } from '../../auth';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MAX_CHARS = 300;

export function CreatePostModal({ isOpen, onClose }: CreatePostModalProps) {
  const [text, setText] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const { agent } = useAuthStore();
  const remainingChars = MAX_CHARS - text.length;

  // Prevent scroll when modal is open
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

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    if (newText.length <= MAX_CHARS) {
      setText(newText);
    }
  };

  const handlePost = async () => {
    if (!agent || !text.trim() || text.length > MAX_CHARS) return;

    try {
      setIsPosting(true);
      
      // Create post with proper encoding
      await agent.post({
        text: text.trim(),
        createdAt: new Date().toISOString(),
        langs: ['en'],
      });

      setText('');
      onClose();
    } catch (err) {
      console.error('Error creating post:', err);
    } finally {
      setIsPosting(false);
    }
  };

  if (!isOpen) return null;

  const modal = (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-gray-200 bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div 
          //className="bg-white rounded-xl w-full max-w-lg shadow-xl relative"
          className="bg-gradient-to-r from-white via-gray-100 to-blue-100 rounded-xl w-full max-w-lg shadow-xl relative"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
             <div className="flex items-center">
                <SquarePen className="w-5 h-5 text-blue-500 mr-2" />
                <h3 className="text-lg font-medium text-sm text-gray-700">New Post</h3>
            </div>
            
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            <div className="relative text-sm">
              <textarea
                value={text}
                onChange={handleTextChange}
                placeholder="What's on your mind? ✍️"
                className="w-full h-60 p-1 border border-gray-100 rounded-lg resize-none"
                autoFocus
              />
              <div className={`absolute bottom-3 right-3 text-sm ${
                remainingChars <= 20 
                  ? 'text-red-500' 
                  : remainingChars <= 50 
                    ? 'text-yellow-500' 
                    : 'text-gray-400'
              }`}>
                {remainingChars}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex space-x-2">
                <button
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                  title="Add image"
                >
                  <Image className="w-5 h-5" />
                </button>
                <button
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                  title="Add link"
                >
                  <Link2 className="w-5 h-5" />
                </button>
              </div>
              <button
                onClick={handlePost}
                disabled={!text.trim() || isPosting || text.length > MAX_CHARS}
                className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:bg-blue-300 transition-colors"
              >
                {isPosting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    <span>Posting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    <span>Post</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render modal at root level using portal
  return createPortal(modal, document.body);
}