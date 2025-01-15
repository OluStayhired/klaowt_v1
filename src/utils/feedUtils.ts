import { Feed } from '../types/feed';

export function sortFeedsWithPinned(feeds: Feed[], pinnedFeeds: Set<string>): Feed[] {
  return [...feeds].sort((a, b) => {
    // Following feed always comes first
    if (a.uri === 'following') return -1;
    if (b.uri === 'following') return 1;

    // Then sort by pinned status
    const aPinned = pinnedFeeds.has(a.uri);
    const bPinned = pinnedFeeds.has(b.uri);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    return 0;
  });
}