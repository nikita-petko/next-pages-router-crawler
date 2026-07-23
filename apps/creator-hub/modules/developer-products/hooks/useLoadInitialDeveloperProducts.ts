import { useCallback, useEffect, useMemo, useState } from 'react';
import { DEFAULT_PAGE_LIMIT, INITIAL_FETCH_TOTAL } from '../queries/constants';
import {
  useCountDeveloperProducts,
  type UseCountDeveloperProductsParams,
} from './useCountDeveloperProducts';
import type { UseInfiniteListDeveloperProductsQueryOptions } from '../queries/useInfiniteListDeveloperProducts';

export type UseLoadInitialDeveloperProductsParams = UseCountDeveloperProductsParams & {
  /** Total number of products to initially retrieve */
  initialTotal?: number;
};

/**
 * Hook to preload initial developer products for a given universe ID
 */
export function useLoadInitialDeveloperProducts(
  {
    universeId,
    limit = DEFAULT_PAGE_LIMIT,
    initialTotal = INITIAL_FETCH_TOTAL,
    getPageCount,
    shouldShortCircuit,
  }: UseLoadInitialDeveloperProductsParams,
  options: UseInfiniteListDeveloperProductsQueryOptions = {},
) {
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(false);
  const [isInitialError, setIsInitialError] = useState<boolean>(false);

  const {
    data: count,
    isLoading,
    isLoadingError,
    hasNextPage,
    fetchNextPage,
  } = useCountDeveloperProducts({ universeId, limit, getPageCount, shouldShortCircuit }, options);

  const tryFetchNextPage = useCallback(async () => {
    try {
      await fetchNextPage({ throwOnError: true });
      setIsInitialError(false);
    } catch (e) {
      // This is expected when fetch is auto-cancelled. Ignore silent errors
      if (e instanceof Error && 'silent' in e) {
        return;
      }

      setIsInitialError(true);
    }
  }, [fetchNextPage]);

  useEffect(() => {
    // Set isInitialLoading to true if first fetch has been triggered - we should not set this default if enabled = false
    if (isLoading) {
      setIsInitialLoading(true);
      setIsInitialError(false);
    }

    if (count === undefined) {
      return;
    }

    if (count < initialTotal && hasNextPage) {
      tryFetchNextPage();
    } else {
      setIsInitialLoading(false);
    }
  }, [count, isLoading, initialTotal, hasNextPage, tryFetchNextPage]);

  return useMemo(
    () =>
      ({
        isEmpty: count === 0,
        hitInitialTotal: count !== undefined && count >= initialTotal,
        isInitialLoading: isInitialLoading || isLoading,
        isInitialError: isInitialError || isLoadingError,
      }) as const,
    [isInitialError, isInitialLoading, isLoading, isLoadingError, count, initialTotal],
  );
}
