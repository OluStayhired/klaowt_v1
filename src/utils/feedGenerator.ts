import { BskyAgent } from '@atproto/api';
import { FeedAlgorithm } from '../components/feeds/create/types';

const debugLog = (message: string, data?: any) => {
  console.log(`[Feed Generator] ${message}`, data ? JSON.stringify(data, null, 2) : '');
};

export async function createSavedFeed(agent: BskyAgent, algorithm: FeedAlgorithm) {
  if (!agent || !algorithm.name) {
    throw new Error('Missing required data for feed creation');
  }

  // Validate feed name length (max 24 characters)
  if (algorithm.name.length > 24) {
    throw new Error('Feed name must not exceed 24 characters');
  }

  try {
    debugLog('Starting feed creation process', { algorithm });

    // Get current preferences first
    const prefsResponse = await agent.app.bsky.actor.getPreferences();
    const preferences = prefsResponse.data.preferences;

    debugLog('Retrieved current preferences', { preferences });

    // Find or create saved feeds preference
    let savedFeedsPref = preferences.find(
      (pref: any) => pref.$type === 'app.bsky.actor.defs#savedFeedsPrefV2'
    );

    if (!savedFeedsPref) {
      savedFeedsPref = {
        $type: 'app.bsky.actor.defs#savedFeedsPrefV2',
        items: []
      };
      preferences.push(savedFeedsPref);
    }

    // Generate a unique ID for the new feed
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const feedId = `feed-${timestamp}-${randomString}`;

    debugLog('Generated feed ID', { feedId });

    // Create feed URI in the correct format
    const feedUri = `at://${agent.session?.did}/app.bsky.feed.generator/${feedId}`;

    // Add the new feed to preferences
    savedFeedsPref.items.push({
      $type: 'app.bsky.actor.defs#savedFeedsPref',
      type: 'feed',
      value: feedUri,
      id: feedId,
      pinned: true
    });

    debugLog('Updated preferences with new feed', { 
      feedUri,
      updatedPreferences: preferences 
    });

    // Update preferences first
    await agent.app.bsky.actor.putPreferences({
      preferences: preferences
    });

    debugLog('Successfully updated preferences');

    // Create the feed generator record with proper format
    const createResponse = await agent.com.atproto.repo.putRecord({
      repo: agent.session?.did || '',
      collection: 'app.bsky.feed.generator',
      rkey: feedId,
      record: {
        did: agent.session?.did,
        displayName: algorithm.name.trim(),
        description: (algorithm.description || '').trim(),
        createdAt: new Date().toISOString(),
        labels: {
          $type: 'com.atproto.label.defs#selfLabels',
          values: algorithm.keywords?.map(keyword => ({
            val: keyword,
            src: agent.session?.did || ''
          })) || []
        },
        // Required fields for feed generator
        $type: 'app.bsky.feed.generator',
        purpose: 'Custom feed',
        searchTerms: algorithm.keywords || [],
        isEnabled: true,
        isPrivate: false,
        // Add feed algorithm settings
        filter: {
          $type: 'app.bsky.feed.defs#feedFilter',
          settings: {
            interactionThresholds: algorithm.interactionThresholds || {},
            timeRange: algorithm.timeRange || {},
            contentTypes: algorithm.contentTypes || ['text', 'image', 'link'],
            keywords: algorithm.keywords || []
          }
        }
      }
    });

    debugLog('Successfully created feed record', { 
      response: createResponse 
    });

    return feedUri;
  } catch (err) {
    debugLog('Error creating saved feed', err);
    throw err;
  }
}