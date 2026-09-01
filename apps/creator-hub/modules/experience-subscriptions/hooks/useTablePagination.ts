import { useCallback, useState } from 'react';

export const DEFAULT_ROWS_PER_PAGE = 50;

type UsePaginationConfig = {
  count: number;
  initialRowsPerPage?: number;
};

export function useTablePagination({
  count,
  initialRowsPerPage = DEFAULT_ROWS_PER_PAGE,
}: UsePaginationConfig) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);

  const onPageChange = useCallback(
    (_: unknown, value: number) => {
      // Clamp page to valid values
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

  return {
    page,
    rowsPerPage,
    onPageChange,
    onRowsPerPageChange,
  };
}
