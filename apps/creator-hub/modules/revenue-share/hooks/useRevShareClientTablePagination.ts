// Client-side table page state for Foundation TablePagination (known total, filter-then-page).
import { useCallback, useState } from 'react';

export const REV_SHARE_DEFAULT_ROWS_PER_PAGE = 100;
export const REV_SHARE_ROWS_PER_PAGE_OPTIONS = [25, 50, 100] as const;

type UseRevShareClientTablePaginationConfig = {
  /** Total rows after filters/search (Foundation `totalRows`). */
  count: number;
  /** Initial rows per page. Defaults to 100. */
  initialRowsPerPage?: number;
  /** When this value changes, pagination resets to page 0. */
  resetKey?: unknown;
};

/**
 * Pagination state shaped for Foundation `TablePagination` (`onPageChange(page)`,
 * `onRowsPerPageChange(rowsPerPage)`), with `resetKey` support like monetization
 * `useTablePagination`.
 */
export function useRevShareClientTablePagination({
  count,
  initialRowsPerPage = REV_SHARE_DEFAULT_ROWS_PER_PAGE,
  resetKey,
}: UseRevShareClientTablePaginationConfig) {
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
    (nextPage: number) => {
      setPage(Math.max(0, Math.min(nextPage, maxPage)));
    },
    [maxPage],
  );

  const onRowsPerPageChange = useCallback((nextRowsPerPage: number) => {
    setRowsPerPage(nextRowsPerPage);
    setPage(0);
  }, []);

  return {
    page: safePage,
    rowsPerPage,
    onPageChange,
    onRowsPerPageChange,
  };
}

/** Slice a list for the current Foundation table page. */
export function sliceRevShareTablePage<T>(
  items: readonly T[],
  page: number,
  rowsPerPage: number,
): T[] {
  const start = page * rowsPerPage;
  return items.slice(start, start + rowsPerPage);
}
