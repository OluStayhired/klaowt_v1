import { useState, useEffect } from 'react';
import nlp from 'compromise';
import { FeedAlgorithm } from '../types';

const debugLog = (message: string, data?: any) => {
  console.log(`[Algorithm Parser] ${message}`, data ? JSON.stringify(data, null, 2) : '');
};

// Enhanced training data for the NLP model
nlp.extend((Doc: any, world: any) => {
  // Expanded interaction terms with variations
  world.addWords({
    // Interaction metrics with all variations
    like: 'Interaction',
    likes: 'Interaction',
    liked: 'Interaction',
    repost: 'Interaction',
    reposts: 'Interaction',
    reposted: 'Interaction',
    reply: 'Interaction',
    replies: 'Interaction',
    replied: 'Interaction',
    share: 'Interaction',
    shares: 'Interaction',
    shared: 'Interaction',
    comment: 'Interaction',
    comments: 'Interaction',
    commented: 'Interaction',
    
    // Time-related terms
    hour: 'TimeUnit',
    hours: 'TimeUnit',
    hr: 'TimeUnit',
    hrs: 'TimeUnit',
    h: 'TimeUnit',
    day: 'TimeUnit',
    days: 'TimeUnit',
    d: 'TimeUnit',
    week: 'TimeUnit',
    weeks: 'TimeUnit',
    w: 'TimeUnit',
    month: 'TimeUnit',
    months: 'TimeUnit',
    m: 'TimeUnit',
    ago: 'TimeModifier',
    
    // Social graph terms
    follow: 'Social',
    following: 'Social',
    follower: 'Social',
    followers: 'Social',
    mutual: 'Social',
    mutuals: 'Social',
  });

  // Enhanced patterns for better matching
  world.addPatterns({
    // Improved interaction patterns to catch more variations
    InteractionPhrase: '(at least|more than|over|minimum|min|has|with|having)? #Value #Interaction',
    SimpleInteractionPhrase: '#Value #Interaction',
    
    // Time patterns with variations
    TimePhrase: '#Value #TimeUnit (ago)?',
    ShortTimePhrase: '#Value #TimeUnit',
    
    // Social graph patterns
    SocialPhrase: '(my|their|from) #Social',
  });
});

export function useAlgorithmParser(description: string) {
  const [algorithm, setAlgorithm] = useState<FeedAlgorithm>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!description.trim()) {
      debugLog('Empty description, resetting algorithm');
      setAlgorithm({});
      return;
    }

    debugLog('Starting algorithm parsing', { description });
    setIsProcessing(true);
    setError(null);

    try {
      const doc = nlp(description);
      const newAlgorithm: FeedAlgorithm = {};

      // Extract interaction thresholds with improved matching
      debugLog('Extracting interaction thresholds');
      const interactions = doc.match('(#SimpleInteractionPhrase|#InteractionPhrase)').out('array');
      debugLog('Found interaction phrases', { interactions });
      
      if (interactions.length) {
        newAlgorithm.interactionThresholds = {
          minLikes: 0,
          minReposts: 0,
          minReplies: 0
        };

        interactions.forEach(interaction => {
          // Improved regex to catch more number formats
          const match = interaction.match(/(\d+)\s*([k|K])?\s*(like|likes|repost|reposts|reply|replies|share|shares|comment|comments)/i);
          if (match) {
            const [, value, multiplier, type] = match;
            let numValue = parseInt(value);
            
            // Handle k/K multiplier (1k = 1000)
            if (multiplier?.toLowerCase() === 'k') {
              numValue *= 1000;
            }

            const typeKey = type.toLowerCase();
            if (typeKey.includes('like')) {
              newAlgorithm.interactionThresholds!.minLikes = numValue;
            } else if (typeKey.includes('repost') || typeKey.includes('share')) {
              newAlgorithm.interactionThresholds!.minReposts = numValue;
            } else if (typeKey.includes('repl') || typeKey.includes('comment')) {
              newAlgorithm.interactionThresholds!.minReplies = numValue;
            }
          }
        });
        debugLog('Found interaction thresholds', { thresholds: newAlgorithm.interactionThresholds });
      }

      // Rest of the parsing logic remains the same...
      // Enhanced time range detection
      debugLog('Extracting time ranges');
      const timeTerms = doc.match('#Value #TimeUnit (ago)?').out('array');
      if (timeTerms.length) {
        const now = new Date();
        const start = new Date(now);
        
        timeTerms.forEach(term => {
          const match = term.match(/(\d+)\s*(h|hr|hrs?|d|days?|w|weeks?|m|months?)/i);
          if (match) {
            const [, value, unit] = match;
            const numValue = parseInt(value);
            
            switch (unit.toLowerCase()[0]) {
              case 'h':
                start.setHours(now.getHours() - numValue);
                break;
              case 'd':
                start.setDate(now.getDate() - numValue);
                break;
              case 'w':
                start.setDate(now.getDate() - (numValue * 7));
                break;
              case 'm':
                start.setMonth(now.getMonth() - numValue);
                break;
            }
          }
        });

        newAlgorithm.timeRange = { start, end: now };
        debugLog('Found time range', { timeRange: newAlgorithm.timeRange });
      }

      // Extract keywords with improved context understanding
      debugLog('Extracting keywords and topics');
      const keywords = new Set<string>();
      
      // Find explicit topic phrases
      const topicPhrases = doc.match('(about|regarding|discussing|containing|mentioning|on) [0-3] (#Noun|#Adjective)').out('array');
      debugLog('Found topic phrases', { phrases: topicPhrases });
      
      topicPhrases.forEach(phrase => {
        const words = phrase.split(' ');
        // Skip the topic indicator word
        const keyword = words.slice(1).join(' ').toLowerCase();
        if (keyword) keywords.add(keyword);
      });

      // Also check for standalone topics
      const topics = doc.topics().out('array');
      topics.forEach(topic => keywords.add(topic.toLowerCase()));

      if (keywords.size > 0) {
        newAlgorithm.keywords = Array.from(keywords);
        debugLog('Final keywords', { keywords: newAlgorithm.keywords });
      }

      debugLog('Final algorithm', { algorithm: newAlgorithm });
      setAlgorithm(newAlgorithm);
    } catch (err) {
      const errorMessage = 'Failed to parse algorithm rules';
      debugLog('Error parsing algorithm', { error: err });
      setError(errorMessage);
      console.error('Algorithm parsing error:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [description]);

  return { algorithm, isProcessing, error };
}