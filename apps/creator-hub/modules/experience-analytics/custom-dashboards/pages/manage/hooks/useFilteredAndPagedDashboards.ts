import { useMemo } from 'react';
import { UNRESOLVED_CREATED_BY_USERNAME } from '../../../constants/unresolvedCreatedByUsername';
import type { UserDisplayNamesById } from '../../../hooks/useUserDisplayNamesQuery';
import type { CustomDashboardListItem } from '../../../types';

export type FilteredAndPagedDashboards = {
  /** Total rows after the search filter is applied (drives "of N" readout). */
  readonly filteredCount: number;
  /** Total pages, given `filteredCount` and `pageSize`. Always ≥ 1. */
  readonly totalPages: number;
  /** Dashboards to render on the current page, in display order. */
  readonly pagedItems: ReadonlyArray<CustomDashboardListItem>;
  /** 1-indexed inclusive index of the first row on this page (`0` if empty). */
  readonly rangeStart: number;
  /** 1-indexed inclusive index of the last row on this page (`0` if empty). */
  readonly rangeEnd: number;
};

function matchesSearch(
  item: CustomDashboardListItem,
  normalizedQuery: string,
  userDisplayNamesById: UserDisplayNamesById,
): boolean {
  if (!normalizedQuery) {
    return true;
  }
  const haystackName = item.name.toLowerCase();
  if (haystackName.includes(normalizedQuery)) {
    return true;
  }
  const description = item.description?.toLowerCase() ?? '';
  if (description.includes(normalizedQuery)) {
    return true;
  }
  const creatorName = userDisplayNamesById.get(item.createdByUserId) ?? item.createdByUsername;
  if (!creatorName || creatorName === UNRESOLVED_CREATED_BY_USERNAME) {
    return false;
  }
  return creatorName.toLowerCase().includes(normalizedQuery);
}

/**
 * Filter (name + description + visible creator name, case-insensitive) → slice.
 * The visible creator name is the display name resolved from
 * `createdByUserId` (API-backed rows carry an unresolved username sentinel or
 * a blank username), falling back to the persisted username only while
 * display names are still loading. `userDisplayNamesById` must span the
 * unfiltered `allItems` — not just the rendered page — so a row that matches
 * only by its resolved creator name isn't filtered out before its display
 * name is available. The list returned by the service is already sorted by
 * `sortDashboardsForList` (pinned-first → updatedAt desc → id), and
 * `Array.prototype.filter` preserves that order, so the manage page must NOT
 * resort here — re-sorting by `updatedAt` alone would drop pinned dashboards
 * out of the leading rows.
 */
export function useFilteredAndPagedDashboards(
  allItems: ReadonlyArray<CustomDashboardListItem> | undefined,
  searchQuery: string,
  page: number,
  pageSize: number,
  userDisplayNamesById: UserDisplayNamesById,
): FilteredAndPagedDashboards {
  return useMemo<FilteredAndPagedDashboards>(() => {
    const items = allItems ?? [];
    const normalizedQuery = searchQuery.trim().toLowerCase();

    const filtered = normalizedQuery
      ? items.filter((item) => matchesSearch(item, normalizedQuery, userDisplayNamesById))
      : items;

    const filteredCount = filtered.length;
    const safePageSize = Math.max(1, Math.floor(pageSize));
    const totalPages = Math.max(1, Math.ceil(filteredCount / safePageSize));
    const safePage = Math.min(Math.max(1, Math.floor(page)), totalPages);

    const startIndex = (safePage - 1) * safePageSize;
    const endIndex = Math.min(startIndex + safePageSize, filteredCount);
    const pagedItems = filtered.slice(startIndex, endIndex);

    return {
      filteredCount,
      totalPages,
      pagedItems,
      rangeStart: filteredCount === 0 ? 0 : startIndex + 1,
      rangeEnd: endIndex,
    };
  }, [allItems, searchQuery, page, pageSize, userDisplayNamesById]);
}
