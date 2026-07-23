import { useCallback, useEffect, useState } from 'react';

export const DEFAULT_ROWS_PER_PAGE = 50;

type UsePaginationConfig = {
  /** The total number of items to paginate */
  count: number;
  /** The initial number of rows per page. Defaults to 50. */
  initialRowsPerPage?: number;
};

/**
 * Hook for exposing pagination state and handlers for WebBlox `TablePagination`.
 */
export function useTablePagination({
  count,
  initialRowsPerPage = DEFAULT_ROWS_PER_PAGE,
}: UsePaginationConfig) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);

  const onPageChange = useCallback(
    (_: unknown, value: number) => {
      // Note that the component does not allow invalid values here based
      // on the item count, but still worth clamping against
      const newValue = Math.max(0, Math.min(value, Math.ceil(count / rowsPerPage) - 1));
      setPage(newValue);
    },
    [count, rowsPerPage],
  );

  const onRowsPerPageChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
  }, []);

  useEffect(() => {
    // Clamp page to valid values on change
    if (count < page * rowsPerPage) {
      setPage(Math.max(0, Math.ceil(count / rowsPerPage) - 1));
    }
  }, [count, page, rowsPerPage]);

  return {
    page,
    rowsPerPage,
    onPageChange,
    onRowsPerPageChange,
  };
}
