import { useState, useEffect } from 'react';
import { useAuthStore } from '../auth';

export function usePinnedUsers() {
  const [pinnedUsers, setPinnedUsers] = useState<Set<string>>(new Set());
  const { agent } = useAuthStore();

  useEffect(() => {
    async function fetchPinnedUsers() {
      if (!agent) return;

      try {
        const preferencesResponse = await agent.app.bsky.actor.getPreferences();
        const savedUsersPref = preferencesResponse.data.preferences.find(
          (pref: any) => pref.$type === 'app.bsky.actor.defs#savedUsersPrefV2'
        );

        if (savedUsersPref?.items) {
          const pinnedDids = new Set(
            savedUsersPref.items
              .filter((item: any) => item.type === 'user')
              .map((item: any) => item.value)
          );
          setPinnedUsers(pinnedDids);
        }
      } catch (err) {
        console.error('Error fetching pinned users:', err);
      }
    }

    fetchPinnedUsers();
  }, [agent]);

  return { pinnedUsers, setPinnedUsers };
}
