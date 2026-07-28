import { useCallback, useMemo, useState } from 'react';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { DEFAULT_PAGE_SIZE } from '../constants';
import { pageChangeEvent, pageSizeEvent } from '../unifiedLoggerUtils';

type UsePaginatedTableParams = {
  universeId?: number;
  isOwner: boolean;
  tab: string;
};

// Shared pagination state + analytics for the collaborator tables. Slices the provided data into
// the current page and logs page/page-size change events.
const useLocallyPaginatedTable = <T>(
  data: Array<T>,
  { universeId, isOwner, tab }: UsePaginatedTableParams,
) => {
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_PAGE_SIZE);

  const paginatedRows = useMemo(
    () => data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [data, page, rowsPerPage],
  );

  const handlePageChange = useCallback(
    (nextPage: number) => {
      unifiedLogger.logClickEvent(
        pageChangeEvent(universeId ?? 0, isOwner, tab, rowsPerPage, nextPage > page),
      );
      setPage(nextPage);
    },
    [unifiedLogger, universeId, isOwner, tab, rowsPerPage, page],
  );

  const handleRowsPerPageChange = useCallback(
    (nextRowsPerPage: number) => {
      unifiedLogger.logClickEvent(pageSizeEvent(universeId ?? 0, isOwner, tab, nextRowsPerPage));
      setRowsPerPage(nextRowsPerPage);
      setPage(0);
    },
    [unifiedLogger, universeId, isOwner, tab],
  );

  return { page, rowsPerPage, paginatedRows, handlePageChange, handleRowsPerPageChange };
};

export default useLocallyPaginatedTable;
