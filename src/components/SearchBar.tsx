import React, { useState, useEffect } from 'react';
import { Search, Mic, MicOff, X } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export function SearchBar({ onSearch, placeholder }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

   // Add clear function
  const handleClear = () => {
    setQuery('');
    onSearch(''); // Also trigger search with empty query
  };

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        onSearch(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognition);
    }
  }, [onSearch]);

  const handleVoiceSearch = () => {
    if (isListening) {
      recognition?.stop();
    } else {
      recognition?.start();
    }
    setIsListening(!isListening);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    onSearch(newQuery);
  };

  return (
    <form onSubmit={handleSubmit} className="relative mb-6">
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder={placeholder || "Search every feed on Bluesky 🦋"}
          className="w-full pl-10 pr-12 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
        />
       <div className="absolute right-3 flex items-center space-x-2">
          {query && ( // Only show X button when there's text
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
              title="Clear search"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          )}
          {recognition && (
            <button
              type="button"
              onClick={handleVoiceSearch}
              className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
              title={isListening ? "Stop voice search" : "Start voice search"}
            >
              {isListening ? (
                <MicOff className="w-5 h-5 text-red-500" />
              ) : (
                <Mic className="w-5 h-5 text-gray-400" />
              )}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}