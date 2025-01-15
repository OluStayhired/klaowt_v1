import { BskyAgent } from '@atproto/api';
import { Feed } from '../types/feed';

export async function pinFeed(agent: BskyAgent, feed: Feed) {
  try {
    const prefs = await agent.app.bsky.actor.getPreferences();
    const currentPrefs = prefs.data.preferences;

    const savedFeedsPrefIndex = currentPrefs.findIndex(
      (pref) => pref.$type === 'app.bsky.actor.defs#savedFeedsPrefV2'
    );

    let savedFeedsPref = savedFeedsPrefIndex !== -1
      ? currentPrefs[savedFeedsPrefIndex]
      : { $type: 'app.bsky.actor.defs#savedFeedsPrefV2', items: [] };

    // Ensure feed.uri is defined and is a string
    if (typeof feed.uri !== 'string' || !feed.uri) {
      console.error("Invalid feed URI:", feed.uri);
      throw new Error("Invalid feed URI"); // Or handle this error appropriately in your UI
    }

    // Create a NEW items array, ensuring each item has an ID
    const newItems = savedFeedsPref.items.filter((item: any) => item.value !== feed.uri);

    newItems.push({
      id: feed.uri, // Use feed.uri as the ID - this is the KEY
      type: 'feed',
      value: feed.uri,
      pinned: true, // Add the pinned property and set it to true
    });

    savedFeedsPref.items = newItems;

    if (savedFeedsPrefIndex !== -1) {
      currentPrefs[savedFeedsPrefIndex] = savedFeedsPref;
    } else {
      currentPrefs.push(savedFeedsPref);
    }

    await agent.app.bsky.actor.putPreferences({ preferences: currentPrefs });
    console.log("Feed Pinned/Updated Successfully", feed.uri);
  } catch (error) {
    console.error("Error pinning/updating feed:", error);
    // Important: Re-throw the error or handle it in the calling component
    throw error; // This is crucial for proper error propagation
  }
}