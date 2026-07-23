import { useEffect, useRef } from 'react';

const FETCH_INTERVAL_MS = 1000;

export type UseBackgroundPageLoaderParams = {
  /** Whether there is a next page to fetch, used for lazy loading */
  hasNextPage: boolean;
  /** Function to fetch the next page, used for lazy loading. */
  fetchNextPage: () => void;
  /** Whether to disable the background page loader */
  disabled?: boolean;
  /** The interval at which to fetch the next page, in milliseconds */
  intervalMs?: number;
};

/**
 * Continuously fetches next pages in the background at a 1-second interval
 * until all pages have been loaded (`hasNextPage` becomes false).
 *
 * @example
 *
 * ```ts
 * const { hasNextPage, fetchNextPage } = useInfiniteQuery({
 *   queryKey: ['items'],
 *   queryFn: () => fetchItems(),
 *   getNextPageParam: (lastPage) => lastPage.nextPageToken,
 * });
 *
 * useBackgroundPageLoader({ hasNextPage, fetchNextPage });
 * ```
 *
 */
export function useBackgroundPageLoader({
  hasNextPage,
  fetchNextPage,
  disabled,
  intervalMs = FETCH_INTERVAL_MS,
}: UseBackgroundPageLoaderParams) {
  const fetchNextPageRef = useRef(fetchNextPage);
  fetchNextPageRef.current = fetchNextPage;

  useEffect(() => {
    if (!hasNextPage || disabled) return undefined;

    fetchNextPageRef.current();

    const intervalId = setInterval(() => {
      fetchNextPageRef.current();
    }, intervalMs);

    return () => clearInterval(intervalId);
  }, [hasNextPage, disabled, intervalMs]);
}
