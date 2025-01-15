import { BskyAgent } from '@atproto/api';

export async function getPinnedFeeds(agent: BskyAgent): Promise<Set<string>> {
  const response = await agent.app.bsky.actor.getPreferences();
  const savedFeedsPref = response.data.preferences.find(
    (pref: any) => pref.$type === 'app.bsky.actor.defs#savedFeedsPrefV2'
  );

  if (!savedFeedsPref?.items) return new Set();

  return new Set(
    savedFeedsPref.items
      .filter((item: any) => item.type === 'feed')
      .map((item: any) => item.value)
  );
}

export async function pinFeed(agent: BskyAgent, feedUri: string): Promise<void> {
  const response = await agent.app.bsky.actor.getPreferences();
  const preferences = response.data.preferences;

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

  const isAlreadyPinned = savedFeedsPref.items.some(
    (item: any) => item.value === feedUri
  );

  if (!isAlreadyPinned) {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const id = `feed-${timestamp}-${randomString}`;

    savedFeedsPref.items.push({
      $type: 'app.bsky.actor.defs#savedFeedsPref',
      type: 'feed',
      value: feedUri,
      id: id,
      pinned: true
    });

    await agent.app.bsky.actor.putPreferences({
      preferences: preferences
    });
  }
}

export async function unpinFeed(agent: BskyAgent, feedUri: string): Promise<void> {
  const response = await agent.app.bsky.actor.getPreferences();
  const preferences = response.data.preferences;

  const savedFeedsPref = preferences.find(
    (pref: any) => pref.$type === 'app.bsky.actor.defs#savedFeedsPrefV2'
  );

  if (savedFeedsPref) {
    // Remove the feed from the items array
    savedFeedsPref.items = savedFeedsPref.items.filter(
      (item: any) => item.value !== feedUri
    );

    // Update preferences
    await agent.app.bsky.actor.putPreferences({
      preferences: preferences
    });
  }
}

export async function removeInvalidFeeds(agent: BskyAgent): Promise<void> {
  const response = await agent.app.bsky.actor.getPreferences();
  const preferences = response.data.preferences;

  const savedFeedsPref = preferences.find(
    (pref: any) => pref.$type === 'app.bsky.actor.defs#savedFeedsPrefV2'
  );

  if (savedFeedsPref) {
    // Filter out any feeds that have invalid URIs or service details
    const validFeeds = savedFeedsPref.items.filter((item: any) => {
      if (item.type !== 'feed') return true;
      
      // Keep only valid feed URIs and known working feeds
      const uri = item.value;
      return uri === 'following' || 
             uri.startsWith('at://did:plc:') && 
             !uri.includes('invalid');
    });

    savedFeedsPref.items = validFeeds;

    // Update preferences with cleaned feed list
    await agent.app.bsky.actor.putPreferences({
      preferences: preferences
    });
  }
}