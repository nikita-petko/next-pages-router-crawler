import type { CustomDashboardListItem } from '../types';

/**
 * Total order on dashboard list rows: pinned first, then most recently
 * updated, with `id` as the deterministic final tiebreak.
 *
 * Centralised so InMemory, LocalStorage, and any future backend share the
 * same surface contract without drifting on edge cases (two dashboards
 * pinned at the same instant, two updates in the same millisecond, etc.).
 * The eventual server implementation must produce the same order so the
 * manage-page list view doesn't visibly reshuffle when the store swaps.
 *
 * Pure: returns a new array, leaves the input untouched.
 */
export function sortDashboardsForList(
  items: ReadonlyArray<CustomDashboardListItem>,
): Array<CustomDashboardListItem> {
  return items.toSorted((a, b) => {
    if (a.isPinned !== b.isPinned) {
      return a.isPinned ? -1 : 1;
    }
    if (a.updatedAt !== b.updatedAt) {
      return a.updatedAt < b.updatedAt ? 1 : -1;
    }
    if (a.id === b.id) {
      return 0;
    }
    return a.id < b.id ? -1 : 1;
  });
}
