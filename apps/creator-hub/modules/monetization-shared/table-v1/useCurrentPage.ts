import { useEffect, useMemo } from 'react';

type UseCurrentPageParams = {
  /** The current page number, 0-indexed. See `useTablePagination` for more details. */
  page: number;
  /** The number of items per page. See `useTablePagination` for more details. */
  rowsPerPage: number;
  /** (Optional) Whether there is a next page to fetch, used for lazy loading */
  hasNextPage?: boolean;
  /** (Optional) Function to fetch the next page, used for lazy loading. Fetches when on last page by default. */
  fetchNextPage?: () => void;
  /** (Optional) Number of items fetched per page, used for lazy-loading when reaching the last page. Defaults to `rowsPerPage`. */
  fetchLimit?: number;
};

/**
 * Hook to get the current page of items from a list.
 *
 * @param items - The list of items to paginate.
 * @param options - See {@link UseCurrentPageParams}.
 */
export function useCurrentPage<TItem>(
  items: TItem[],
  { page, rowsPerPage, hasNextPage, fetchNextPage, fetchLimit = rowsPerPage }: UseCurrentPageParams,
) {
  const currentPage = useMemo(() => {
    const start = page * rowsPerPage;
    return items.slice(start, start + rowsPerPage);
  }, [items, page, rowsPerPage]);

  const isOnLastPage = (page + 1) * fetchLimit >= items.length;
  useEffect(() => {
    if (isOnLastPage && hasNextPage) {
      fetchNextPage?.();
    }
  }, [isOnLastPage, hasNextPage, fetchNextPage]);

  return { currentPage } as const;
}
