import nlp from 'compromise';
import Fuse from 'fuse.js';

const debugLog = (message: string, data?: any) => {
  console.log(`[Keyword Matching] ${message}`, data ? JSON.stringify(data, null, 2) : "");
};

// Configure Fuse.js for fuzzy matching
const fuseOptions = {
  includeScore: true,
  threshold: 0.4,
  minMatchCharLength: 3,
  keys: ['text']
};

interface Match {
  word: string;
  score: number;
  type: 'exact' | 'fuzzy' | 'partial' | 'phrase';
  position?: number;
}

// Simple stemming function
function simpleStem(word: string): string {
  return word.toLowerCase()
    .replace(/(?:s|es|ed|ing|ly)$/, '')
    .replace(/(?:tion|sion|ment)$/, '');
}

export function calculateKeywordMatch(text: string, keywords: string[]): {
  percentage: number;
  matchedWords: string[];
  matches: Match[];
} {
  if (!keywords.length) {
    return { percentage: 0, matchedWords: [], matches: [] };
  }

  debugLog('Starting keyword match calculation', { 
    textPreview: text.substring(0, 100), 
    keywords 
  });

  // Normalize text and prepare for analysis
  const normalizedText = text.toLowerCase();
  const doc = nlp(normalizedText);
  
  // Get first sentence for boosting
  const firstSentence = doc.sentences().first().text().toLowerCase();
  
  // Tokenize text
  const tokens = normalizedText.split(/\s+/);
  const stemmedTokens = tokens.map(simpleStem);

  const matches: Match[] = [];
  const matchedWords = new Set<string>();

  // Process each keyword/phrase
  keywords.forEach(keyword => {
    const normalizedKeyword = keyword.toLowerCase();
    const stemmedKeyword = simpleStem(keyword);
    
    // 1. Check for exact phrase matches first (highest priority)
    if (normalizedText.includes(normalizedKeyword)) {
      const position = normalizedText.indexOf(normalizedKeyword);
      const inFirstSentence = firstSentence.includes(normalizedKeyword);
      
      matches.push({
        word: keyword,
        score: inFirstSentence ? 1.2 : 1, // 20% boost for first sentence
        type: 'exact',
        position
      });
      matchedWords.add(keyword);
      return;
    }

    // 2. Check for phrase proximity
    const keywordTokens = normalizedKeyword.split(/\s+/);
    if (keywordTokens.length > 1) {
      let foundAllWords = true;
      let totalDistance = 0;
      let lastPosition = -1;

      for (const token of keywordTokens) {
        const position = tokens.indexOf(token);
        if (position === -1) {
          foundAllWords = false;
          break;
        }
        if (lastPosition !== -1) {
          totalDistance += Math.abs(position - lastPosition - 1);
        }
        lastPosition = position;
      }

      if (foundAllWords) {
        const proximityScore = 1 / (1 + totalDistance);
        matches.push({
          word: keyword,
          score: proximityScore,
          type: 'phrase'
        });
        matchedWords.add(keyword);
        return;
      }
    }

    // 3. Check for partial matches using simple stemming
    const stemMatches = stemmedTokens.filter(token => token === stemmedKeyword);
    if (stemMatches.length > 0) {
      matches.push({
        word: keyword,
        score: 0.8, // 80% score for stem matches
        type: 'partial'
      });
      matchedWords.add(keyword);
      return;
    }

    // 4. Try fuzzy matching as last resort
    const fuse = new Fuse([{ text: normalizedText }], fuseOptions);
    const fuseResults = fuse.search(normalizedKeyword);
    
    if (fuseResults.length > 0 && fuseResults[0].score) {
      const fuzzyScore = 1 - fuseResults[0].score; // Convert Fuse score to our scale
      if (fuzzyScore > 0.6) { // Only count good fuzzy matches
        matches.push({
          word: keyword,
          score: fuzzyScore * 0.7, // 70% max score for fuzzy matches
          type: 'fuzzy'
        });
        matchedWords.add(keyword);
      }
    }
  });

  // Calculate final percentage with weights
  const totalScore = matches.reduce((sum, match) => sum + match.score, 0);
  const maxPossibleScore = keywords.length;
  const percentage = (totalScore / maxPossibleScore) * 100;

  debugLog('Match calculation complete', {
    matchCount: matches.length,
    percentage,
    matchTypes: matches.map(m => m.type),
    scores: matches.map(m => m.score)
  });

  return {
    percentage: Math.min(100, percentage),
    matchedWords: Array.from(matchedWords),
    matches: matches.sort((a, b) => b.score - a.score)
  };
}