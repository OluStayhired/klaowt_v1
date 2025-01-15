import { Feed } from '../types/feed';
import { searchFeeds as nlpSearch } from './nlpSearch';

// Standard search function
function standardSearch(feeds: Feed[], query: string): Feed[] {
  const searchTerms = query.toLowerCase().trim().split(/\s+/);
  
  return feeds.filter(feed => {
    const searchText = `${feed.displayName} ${feed.description} ${feed.category || ''} ${feed.creator.displayName || ''} ${feed.creator.handle}`.toLowerCase();
    return searchTerms.every(term => searchText.includes(term));
  });
}

// Detect if query looks like natural language
function isNaturalLanguageQuery(query: string): boolean {
  const nlpPatterns = [
    /^(show|find|get|give)\s+me/i,
    /\b(about|related\s+to|concerning)\b/i,
    /\b(interested\s+in|like|enjoy)\b/i,
    /\b(feeds?\s+(?:for|about)|content\s+(?:for|about))\b/i,
  ];

  return nlpPatterns.some(pattern => pattern.test(query));
}

export function searchFeeds(feeds: Feed[], query: string): Feed[] {
  if (!query.trim()) return feeds;

  // Choose search method based on query type
  return isNaturalLanguageQuery(query) ? nlpSearch(feeds, query) : standardSearch(feeds, query);
}