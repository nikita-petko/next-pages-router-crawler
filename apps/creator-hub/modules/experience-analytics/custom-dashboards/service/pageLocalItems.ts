import type { CustomDashboardListOptions } from '../types';

function getPageOffset(pageToken: string | undefined): number {
  if (!pageToken) {
    return 0;
  }
  const parsed = Number(pageToken);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0;
}

/** Synthesize page tokens for local/in-memory list backends. */
export function pageLocalItems<T>(
  items: ReadonlyArray<T>,
  options?: CustomDashboardListOptions,
): { items: ReadonlyArray<T>; nextPageToken?: string } {
  const pageSize = options?.pageSize;
  if (pageSize === undefined || pageSize <= 0) {
    return { items };
  }
  const offset = getPageOffset(options?.pageToken);
  const end = offset + pageSize;
  return {
    items: items.slice(offset, end),
    nextPageToken: end < items.length ? String(end) : undefined,
  };
}
