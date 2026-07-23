import { useCallback, useEffect, useMemo, useState } from 'react';
import type { PagedLook } from '@rbx/client-look-api/v1';
import type { GenericTablePaginationSpec } from '@modules/charts-generic/tables/GenericTablePagination';
import { unknownDueToCursorBasedPagination } from '@modules/charts-generic/tables/GenericTablePagination';
import { useAvatarLooksInfiniteQuery } from '@modules/clients/lookQueries';
import { DEFAULT_PAGE_SIZE } from '../constants';

type UseAvatarLooksPaginationResult = {
  tableRows: PagedLook[];
  paginationSpec: GenericTablePaginationSpec;
  isLoading: boolean;
  isPending: boolean;
  isError: boolean;
  hasAnyLookInCache: boolean;
  totalLooksCount: number;
};

export function useAvatarLooksPagination(opts: {
  curatorIdString: string;
  enabled: boolean;
}): UseAvatarLooksPaginationResult {
  const { curatorIdString, enabled } = opts;

  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [displayPageIndex, setDisplayPageIndex] = useState(0);

  const {
    data: looksPages,
    isPending: isLooksPending,
    isError: isLooksError,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useAvatarLooksInfiniteQuery({ curatorUserId: curatorIdString, pageSize, enabled });

  useEffect(() => {
    setDisplayPageIndex(0);
  }, [pageSize, curatorIdString]);

  const loadedPageCount = looksPages?.pages.length ?? 0;

  const tableRows = useMemo(
    () => looksPages?.pages[displayPageIndex]?.data ?? [],
    [looksPages, displayPageIndex],
  );

  const hasAnyLookInCache = looksPages?.pages.some((p) => (p.data ?? []).length > 0) ?? false;

  const totalLooksCount = useMemo(
    () => looksPages?.pages.flatMap((p) => p.data ?? []).length ?? 0,
    [looksPages],
  );

  const setPageSizeAndReset = useCallback((next: number) => {
    setPageSize(next);
    setDisplayPageIndex(0);
  }, []);

  const hasNext =
    displayPageIndex < loadedPageCount - 1 ||
    (displayPageIndex === loadedPageCount - 1 && (hasNextPage ?? false));
  const hasPrevious = displayPageIndex > 0;

  const onNextPage = useCallback(() => {
    if (displayPageIndex < loadedPageCount - 1) {
      setDisplayPageIndex((p) => p + 1);
      return;
    }
    if (hasNextPage) {
      void fetchNextPage().then((result) => {
        if (!result.isError) {
          setDisplayPageIndex((p) => p + 1);
        }
      });
    }
  }, [displayPageIndex, loadedPageCount, hasNextPage, fetchNextPage]);

  const onPreviousPage = useCallback(() => {
    setDisplayPageIndex((p) => Math.max(0, p - 1));
  }, []);

  const hasNextForUi = hasNext && !isFetchingNextPage;

  const paginationSpec = useMemo(
    () => ({
      page: displayPageIndex,
      total: unknownDueToCursorBasedPagination,
      pageSize,
      pageSizeOptions: [10, 25, 50],
      setPageSize: setPageSizeAndReset,
      onNextPage,
      onPreviousPage,
      hasNext: hasNextForUi,
      hasPrevious,
    }),
    [
      displayPageIndex,
      pageSize,
      setPageSizeAndReset,
      onNextPage,
      onPreviousPage,
      hasNextForUi,
      hasPrevious,
    ],
  );

  return {
    tableRows,
    paginationSpec,
    isLoading: isLooksPending && !looksPages,
    isPending: isLooksPending,
    isError: isLooksError,
    hasAnyLookInCache,
    totalLooksCount,
  };
}
