import { useState, useEffect } from 'react';
import { useAuthStore } from '../auth';

export function usePinnedFeeds() {
  const [pinnedFeeds, setPinnedFeeds] = useState<Set<string>>(new Set());
  const { agent } = useAuthStore();

  useEffect(() => {
    async function fetchPinnedFeeds() {
      if (!agent) return;

      try {
        const preferencesResponse = await agent.app.bsky.actor.getPreferences();
        const savedFeedsPref = preferencesResponse.data.preferences.find(
          (pref: any) => pref.$type === 'app.bsky.actor.defs#savedFeedsPrefV2'
        );

        if (savedFeedsPref?.items) {
          const pinnedUris = new Set(
            savedFeedsPref.items
              .filter((item: any) => item.type === 'feed')
              .map((item: any) => item.value)
          );
          setPinnedFeeds(pinnedUris);
        }
      } catch (err) {
        console.error('Error fetching pinned feeds:', err);
      }
    }

    fetchPinnedFeeds();
  }, [agent]);

  return { pinnedFeeds, setPinnedFeeds };
}