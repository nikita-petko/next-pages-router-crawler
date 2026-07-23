import { useCallback, useState } from 'react';

export const DEFAULT_ROWS_PER_PAGE = 50;

type UsePaginationConfig = {
  /** The total number of items to paginate */
  count: number;
  /** The initial number of rows per page. Defaults to 50. */
  initialRowsPerPage?: number;
  /** When this value changes, pagination resets to page 0. */
  resetKey?: unknown;
};

/**
 * Hook for exposing pagination state and handlers for WebBlox `TablePagination`.
 */
export function useTablePagination({
  count,
  initialRowsPerPage = DEFAULT_ROWS_PER_PAGE,
  resetKey,
}: UsePaginationConfig) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);

  const [prevResetKey, setPrevResetKey] = useState(resetKey);
  if (resetKey !== prevResetKey) {
    setPrevResetKey(resetKey);
    setPage(0);
  }

  const maxPage = Math.max(0, Math.ceil(count / rowsPerPage) - 1);
  const safePage = Math.min(page, maxPage);

  const onPageChange = useCallback(
    (_: unknown, value: number) => {
      // Note that the component does not allow invalid values here based
      // on the item count, but still worth clamping against
      const newValue = Math.max(0, Math.min(value, maxPage));
      setPage(newValue);
    },
    [maxPage],
  );

  const onRowsPerPageChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
  }, []);

  return {
    page: safePage,
    rowsPerPage,
    onPageChange,
    onRowsPerPageChange,
  };
}
