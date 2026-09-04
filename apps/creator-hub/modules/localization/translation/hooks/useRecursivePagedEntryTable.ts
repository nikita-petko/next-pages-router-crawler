import { useEffect, useMemo, useRef, useState } from 'react';

/**
 * Shared shape of the localization-tables paged endpoints (string `entries` and image
 * `asset-entries`): a cursor-paged list where an undefined `nextPageCursor` marks the last page.
 */
export interface PagedEntryResponse<TEntry> {
  nextPageCursor?: string;
  data?: TEntry[];
}

interface UseRecursivePagedEntryTableParams<TEntry> {
  gameId: number | null;
  entryTableId: string;
  maxRetryTimes: number;
  /** Fetches a single page. Must be referentially stable (wrap in `useCallback`). */
  fetchPage: (cursor: string) => Promise<PagedEntryResponse<TEntry>>;
  /** Human-readable noun for error messages, e.g. `'asset entries'`. */
  errorLabel: string;
}

export interface RecursivePagedEntryTable<TEntry> {
  fullEntryTable: TEntry[];
  batchedEntries: TEntry[];
  fetchFullEntryTableError: Error | null;
  isFetchingFullEntryTable: boolean;
  isFullTableLoadingNotStarted: boolean;
  percentageLoaded: number;
}

/**
 * Recursively pages the full entry table for a localization table, accumulating results and
 * retrying each page up to `maxRetryTimes`. Extracted from the strings
 * `LocalizationTableEntriesProvider` so image (asset) entries share the same fetch/retry behavior.
 */
export default function useRecursivePagedEntryTable<TEntry>({
  gameId,
  entryTableId,
  maxRetryTimes,
  fetchPage,
  errorLabel,
}: UseRecursivePagedEntryTableParams<TEntry>): RecursivePagedEntryTable<TEntry> {
  const [fullEntryTable, setFullEntryTable] = useState<TEntry[]>([]);
  const [fetchFullEntryTableError, setFetchFullEntryTableError] = useState<Error | null>(null);
  const [isFetchingFullEntryTable, setIsFetchingFullEntryTable] = useState<boolean>(false);
  const batchedEntries = useRef<TEntry[]>([]);

  useEffect(() => {
    let isMounted = true;
    if (!gameId) {
      throw new Error('Game Id is invalid');
    }
    if (!entryTableId) {
      return () => {
        isMounted = false;
      };
    }

    const recursivelyFetchFullTableInfo = async (
      nextPageCursor: string | undefined,
      retryTimes: number,
    ) => {
      setIsFetchingFullEntryTable(true);
      if (!isMounted || typeof nextPageCursor === 'undefined') {
        setIsFetchingFullEntryTable(false);
        setFetchFullEntryTableError(null);
        return;
      }
      if (retryTimes <= 0) {
        setFetchFullEntryTableError(
          new Error(`Failed to fetch ${errorLabel} after ${maxRetryTimes} retries`),
        );
        setIsFetchingFullEntryTable(false);
        return;
      }
      try {
        const response = await fetchPage(nextPageCursor);
        if (response?.data === undefined) {
          throw new Error(`${errorLabel} table is undefined`);
        }
        // Set the table after each page so users can access loaded entries even if a later page
        // times out.
        batchedEntries.current = response.data;
        setFullEntryTable((entryTable) => [...entryTable, ...batchedEntries.current]);
        await recursivelyFetchFullTableInfo(response.nextPageCursor, maxRetryTimes);
      } catch {
        await recursivelyFetchFullTableInfo(nextPageCursor, retryTimes - 1);
      }
    };

    // oxlint-disable-next-line react/react-compiler -- intentional: reset error state when a fresh fetch kicks off (mirrors the strings LocalizationTableEntriesProvider this was extracted from)
    setFetchFullEntryTableError(null);
    void recursivelyFetchFullTableInfo('', maxRetryTimes);
    return () => {
      isMounted = false;
    };
  }, [gameId, entryTableId, maxRetryTimes, fetchPage, errorLabel]);

  const isFullTableLoadingNotStarted = useMemo(() => {
    return isFetchingFullEntryTable && fullEntryTable.length === 0;
  }, [isFetchingFullEntryTable, fullEntryTable]);

  return useMemo(
    () => ({
      fullEntryTable,
      // oxlint-disable-next-line react/react-compiler -- intentional: expose the latest fetched page held in a ref (mirrors the strings LocalizationTableEntriesProvider this was extracted from)
      batchedEntries: batchedEntries.current,
      fetchFullEntryTableError,
      isFetchingFullEntryTable,
      isFullTableLoadingNotStarted,
      percentageLoaded: isFetchingFullEntryTable ? 0 : 100,
    }),
    [
      fullEntryTable,
      fetchFullEntryTableError,
      isFetchingFullEntryTable,
      isFullTableLoadingNotStarted,
    ],
  );
}
