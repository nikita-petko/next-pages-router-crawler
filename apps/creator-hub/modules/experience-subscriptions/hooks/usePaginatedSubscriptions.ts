import { useCallback, useEffect, useMemo, useState } from 'react';
import { DEFAULT_PAGE_LIMIT, INITIAL_FETCH_TOTAL } from '../queries/constants';
import type { UseInfiniteListSubscriptionsResult } from '../queries/useInfiniteListSubscriptions';
import {
  useInfiniteListSubscriptions,
  type UseInfiniteListSubscriptionsOptions,
  type InfiniteListSubscriptionsData,
} from '../queries/useInfiniteListSubscriptions';
import type { SubscriptionCreatorDetails } from '../types/SubscriptionCreatorDetails';

export const VALID_PAGE_SIZES = [10, 20, 50, 100] as const;
export type PageSize = (typeof VALID_PAGE_SIZES)[number];

type Options = Omit<UseInfiniteListSubscriptionsOptions, 'select'>;

type UseCountSubscriptionsParams = {
  universeId: number;
  limit?: number;
};

type UseLoadInitialSubscriptionsParams = UseCountSubscriptionsParams & {
  initialTotal?: number;
};

// Params match WebBlox's TablePagination component
type UsePaginatedSubscriptionsParams = UseCountSubscriptionsParams & {
  // Current page num
  page: number;
  rowsPerPage: number;
  reset?: () => void;
};

function countTotalSubscriptions({ pages }: InfiniteListSubscriptionsData): number {
  return pages.reduce((total, page) => total + (page.subscriptions?.length ?? 0), 0);
}

// Returns total subscriptions count for a given universe
export function useCountSubscriptions(
  { universeId, limit = DEFAULT_PAGE_LIMIT }: UseCountSubscriptionsParams,
  options: Options = {},
): UseInfiniteListSubscriptionsResult<number> {
  return useInfiniteListSubscriptions(
    { universeId, limit },
    { ...options, select: countTotalSubscriptions },
  );
}

// Preloads a bunch of subs initially
export function useLoadInitialSubscriptions(
  {
    universeId,
    limit = DEFAULT_PAGE_LIMIT,
    initialTotal = INITIAL_FETCH_TOTAL,
  }: UseLoadInitialSubscriptionsParams,
  options: Options = {},
) {
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(false);
  const [isInitialError, setIsInitialError] = useState<boolean>(false);

  const {
    data: count,
    isLoading,
    isLoadingError,
    hasNextPage,
    fetchNextPage,
  } = useCountSubscriptions({ universeId, limit }, options);

  const tryFetchNextPage = useCallback(async () => {
    try {
      await fetchNextPage({ throwOnError: true });
      setIsInitialError(false);
    } catch (e) {
      // Ignore silent errors (auto-cancelled fetches)
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

  const isEmpty = count === 0;

  return useMemo(
    () =>
      ({
        isEmpty,
        isInitialLoading: isInitialLoading || isLoading,
        isInitialError: isInitialError || isLoadingError,
      }) as const,
    [isInitialError, isInitialLoading, isLoading, isLoadingError, isEmpty],
  );
}

// Returns paginated subscriptions for a given page
export function usePaginatedSubscriptions(
  {
    universeId,
    page,
    rowsPerPage,
    reset,
    limit = DEFAULT_PAGE_LIMIT,
  }: UsePaginatedSubscriptionsParams,
  options: Options = {},
) {
  const { data, hasNextPage, fetchNextPage } = useInfiniteListSubscriptions(
    { universeId, limit },
    options,
  );

  // Find page num
  const pageIndex = Math.floor((page * rowsPerPage) / limit);
  // Check if our pagination requires an additional page to properly chunk the data (should not ordinarily occur)
  const requireExtraPage = ((page * rowsPerPage) % limit) + rowsPerPage > limit;
  const isLastPage = pageIndex + 1 === data?.pages.length;

  const paginatedData = useMemo(() => {
    if (!data) {
      return { currentPage: [], isOutOfBounds: false } as const;
    }

    if (pageIndex >= data.pages.length || pageIndex < 0) {
      return { currentPage: [], isOutOfBounds: true } as const;
    }

    const currentPage = data.pages.at(pageIndex)!.subscriptions ?? [];
    const nextPage = requireExtraPage ? data.pages.at(pageIndex + 1)?.subscriptions : [];

    return { currentPage: currentPage.concat(nextPage ?? []) } as const;
  }, [data, pageIndex, requireExtraPage]);

  useEffect(() => {
    if (paginatedData.isOutOfBounds) {
      reset?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only reset on bounds change
  }, [paginatedData.isOutOfBounds]);

  const chunk: SubscriptionCreatorDetails[] = useMemo(() => {
    const startIndex = (page * rowsPerPage) % limit;
    const endIndex = Math.min(startIndex + rowsPerPage, paginatedData.currentPage.length);
    return paginatedData.currentPage.slice(startIndex, endIndex);
  }, [limit, page, paginatedData.currentPage, rowsPerPage]);

  // Prefetch next page when on last page
  useEffect(() => {
    if (isLastPage && hasNextPage) {
      fetchNextPage({ cancelRefetch: false, throwOnError: false });
    }
  }, [isLastPage, hasNextPage, fetchNextPage]);

  return useMemo(() => ({ paginatedSubscriptions: chunk, data }) as const, [chunk, data]);
}
