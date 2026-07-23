import { useCallback, useMemo } from 'react';
import { useBackgroundPageLoader } from '@modules/monetization-shared/useBackgroundPageLoader';
import { useMomentsCreations } from '@modules/react-query/momentsCreations/momentsCreationsQueries';
import { MOMENTS_LIST_PAGE_SIZE } from '../constants/momentsCreationsConstants';
import type { MomentCreation } from '../types/MomentCreation';
import { flattenServerMomentsFromPages } from '../utils/momentsCreationsMergeUtils';

const EMPTY_SERVER_MOMENTS: MomentCreation[] = [];

export type UseMomentsCreationsListReturn = {
  serverMoments: MomentCreation[];
  isAllServerMomentsLoaded: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  error: ReturnType<typeof useMomentsCreations>['error'];
  isPending: boolean;
  isFetchingNextPage: boolean;
  isFetchNextPageError: boolean;
  errorUpdatedAt: number;
  loadedPageCount: number;
  refetch: ReturnType<typeof useMomentsCreations>['refetch'];
  serverPageSize: number;
};

/** Loads paginated server moments (active/published only) and chases remaining pages in the background. */
export function useMomentsCreationsList(
  serverPageSize = MOMENTS_LIST_PAGE_SIZE,
): UseMomentsCreationsListReturn {
  const {
    data,
    error,
    isPending,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    errorUpdatedAt,
  } = useMomentsCreations();

  const serverMoments = useMemo(
    () => (data ? flattenServerMomentsFromPages(data.pages) : EMPTY_SERVER_MOMENTS),
    [data],
  );
  const loadedPageCount = data?.pages.length ?? 0;

  const fetchNextServerPage = useCallback(() => {
    void fetchNextPage({ cancelRefetch: false, throwOnError: false });
  }, [fetchNextPage]);

  const canFetchNextServerPage = hasNextPage && !isFetchNextPageError;

  useBackgroundPageLoader({
    hasNextPage: canFetchNextServerPage,
    fetchNextPage: fetchNextServerPage,
    disabled: isPending,
  });

  const isAllServerMomentsLoaded = !canFetchNextServerPage && !isPending && !isFetchingNextPage;

  return useMemo(
    () =>
      ({
        serverMoments,
        isAllServerMomentsLoaded,
        hasNextPage: canFetchNextServerPage,
        fetchNextPage: fetchNextServerPage,
        error,
        isPending,
        isFetchingNextPage,
        isFetchNextPageError,
        errorUpdatedAt,
        loadedPageCount,
        refetch,
        serverPageSize,
      }) as const,
    [
      canFetchNextServerPage,
      error,
      fetchNextServerPage,
      isAllServerMomentsLoaded,
      isFetchNextPageError,
      isFetchingNextPage,
      isPending,
      errorUpdatedAt,
      loadedPageCount,
      refetch,
      serverMoments,
      serverPageSize,
    ],
  );
}
