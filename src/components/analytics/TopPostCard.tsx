import React from 'react';
import { formatTimeAgo } from '../../utils/formatters';
import { Post } from '../../types/post';

interface TopPostsTableProps {
  posts: Post[];
}

export function TopPostsTable({ posts }: TopPostsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left text-sm text-gray-500 border-b border-gray-200">
            <th className="pb-3 font-medium">When</th>
            <th className="pb-3 font-medium">Post</th>
            <th className="pb-3 font-medium text-right">Likes</th>
            <th className="pb-3 font-medium text-right">Shares</th>
            <th className="pb-3 font-medium text-right">Comments</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {posts.map((post) => (
            <tr key={post.uri} className="hover:bg-gray-50">
              <td className="py-3 text-sm text-gray-500">
                {formatTimeAgo(post.indexedAt)}
              </td>
              <td className="py-3">
                <p className="text-sm text-gray-800 line-clamp-1">
                  {post.record.text}
                </p>
              </td>
              <td className="py-3 text-sm text-right text-gray-600">
                {post.likeCount.toLocaleString()}
              </td>
              <td className="py-3 text-sm text-right text-gray-600">
                {post.repostCount.toLocaleString()}
              </td>
              <td className="py-3 text-sm text-right text-gray-600">
                {post.replyCount.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}