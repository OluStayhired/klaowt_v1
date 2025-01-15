import { Feed } from '../types/feed';

// Keywords and their synonyms for better matching
const KEYWORD_MAPPINGS = {
  tech: ['technology', 'programming', 'coding', 'software', 'developer', 'computer'],
  news: ['headlines', 'journalism', 'current events', 'breaking', 'updates'],
  entertainment: ['fun', 'media', 'movies', 'shows', 'music', 'celebrities'],
  sports: ['athletic', 'game', 'team', 'player', 'competition'],
  gaming: ['games', 'esports', 'streamers', 'gaming content'],
  art: ['creative', 'design', 'artistic', 'visual', 'artwork'],
  community: ['social', 'group', 'cultural', 'people', 'collective'],
  business: ['finance', 'money', 'economy', 'market', 'industry'],
  science: ['scientific', 'research', 'academic', 'study', 'discovery'],
} as const;

// Common natural language patterns
const QUERY_PATTERNS = [
  { pattern: /show me|find|get|give me/i, weight: 0.1 },
  { pattern: /related to|about|concerning/i, weight: 0.2 },
  { pattern: /interested in|like|enjoy/i, weight: 0.2 },
  { pattern: /feeds (for|about)|content (for|about)/i, weight: 0.3 },
];

function expandQuery(query: string): string[] {
  const words = query.toLowerCase().split(/\s+/);
  const expanded = new Set<string>();

  words.forEach(word => {
    expanded.add(word);
    // Add synonyms from keyword mappings
    Object.entries(KEYWORD_MAPPINGS).forEach(([key, synonyms]) => {
      if (synonyms.includes(word) || word === key) {
        expanded.add(key);
        synonyms.forEach(synonym => expanded.add(synonym));
      }
    });
  });

  return Array.from(expanded);
}

function calculateRelevanceScore(feed: Feed, queryTerms: string[]): number {
  let score = 0;
  const feedText = `${feed.displayName} ${feed.description} ${feed.category || ''} ${feed.creator.displayName || ''} ${feed.creator.handle}`.toLowerCase();

  // Score based on direct matches
  queryTerms.forEach(term => {
    if (feedText.includes(term)) {
      score += 1;
    }
  });

  // Boost score based on category match
  if (feed.category && queryTerms.some(term => feed.category?.toLowerCase().includes(term))) {
    score += 2;
  }

  // Boost score for title matches
  if (queryTerms.some(term => feed.displayName.toLowerCase().includes(term))) {
    score += 3;
  }

  return score;
}

function preprocessNaturalLanguageQuery(query: string): string {
  // Remove common natural language patterns
  let processed = query.toLowerCase();
  QUERY_PATTERNS.forEach(({ pattern }) => {
    processed = processed.replace(pattern, '');
  });

  // Remove common stop words
  const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with'];
  processed = processed.split(' ')
    .filter(word => !stopWords.includes(word))
    .join(' ')
    .trim();

  return processed;
}

export function searchFeeds(feeds: Feed[], query: string): Feed[] {
  if (!query.trim()) return feeds;

  // Preprocess the natural language query
  const processedQuery = preprocessNaturalLanguageQuery(query);
  
  // Expand query terms with synonyms
  const expandedTerms = expandQuery(processedQuery);

  // Score and sort feeds
  const scoredFeeds = feeds.map(feed => ({
    feed,
    score: calculateRelevanceScore(feed, expandedTerms)
  }));

  // Sort by score and return only feeds with positive scores
  return scoredFeeds
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.feed);
}