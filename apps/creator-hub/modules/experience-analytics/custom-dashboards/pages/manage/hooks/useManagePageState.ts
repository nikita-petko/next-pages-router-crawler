import { useCallback, useState } from 'react';

export const MANAGE_PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
export const DEFAULT_MANAGE_PAGE_SIZE = 10 as const;

export type ManagePageState = {
  readonly searchQuery: string;
  readonly page: number;
  readonly pageSize: number;
  readonly pageToken?: string;
  setSearchQuery: (next: string) => void;
  clearSearchQuery: () => void;
  setPage: (next: number) => void;
  setPageSize: (next: number) => void;
  setTokenForPage: (page: number, token: string) => void;
};

/** Local-only manage-page state. Page resets to 1 on search / page-size change. */
export function useManagePageState(
  initialPageSize: number = DEFAULT_MANAGE_PAGE_SIZE,
): ManagePageState {
  const [searchQuery, setSearchQueryRaw] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(initialPageSize);
  const [pageTokens, setPageTokens] = useState<Record<number, string | undefined>>({});

  const resetPaging = useCallback(() => {
    setPage(1);
    setPageTokens({});
  }, []);

  const setSearchQuery = useCallback(
    (next: string) => {
      setSearchQueryRaw(next);
      resetPaging();
    },
    [resetPaging],
  );

  const clearSearchQuery = useCallback(() => {
    setSearchQueryRaw('');
    resetPaging();
  }, [resetPaging]);

  const setPageSizeAndResetPage = useCallback(
    (next: number) => {
      setPageSize(next);
      resetPaging();
    },
    [resetPaging],
  );

  const setTokenForPage = useCallback((nextPage: number, token: string) => {
    setPageTokens((current) => ({ ...current, [nextPage]: token }));
  }, []);

  return {
    searchQuery,
    page,
    pageSize,
    pageToken: pageTokens[page],
    setSearchQuery,
    clearSearchQuery,
    setPage,
    setPageSize: setPageSizeAndResetPage,
    setTokenForPage,
  };
}
