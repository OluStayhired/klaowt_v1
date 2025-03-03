import React, { useState, useEffect } from 'react';
import { Search, Users, X } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';

interface UsersSearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export function UsersSearchBar({ onSearch, placeholder }: UsersSearchBarProps) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    onSearch(debouncedQuery);
  }, [debouncedQuery, onSearch]);

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <div className="relative mb-6">
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder || "Search users by name, handle, or bio..."}
          className="w-full pl-10 pr-12 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        )}
      </div>
    </div>
  );
}
