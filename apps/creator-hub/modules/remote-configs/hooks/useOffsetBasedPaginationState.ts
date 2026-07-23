import { GenericTablePaginationSpec } from '@modules/charts-generic';
import { useCallback, useEffect, useMemo, useState } from 'react';

export type OffsetBasedPaginationState = {
  pageSize: number;
  skip: number; // Computed value for API calls
  tablePagination: GenericTablePaginationSpec;
};

/**
 * Hook to manage offset-based pagination state, providing both API parameters and table UI controls
 */
const useOffsetBasedPaginationState = ({
  total,
  initialPageSize = 10,
}: {
  total: number;
  initialPageSize?: number;
}): OffsetBasedPaginationState => {
  const [pageSize, setPageSize] = useState<number>(initialPageSize);
  const [page, setPage] = useState<number>(0);

  const skip = useMemo(() => page * pageSize, [page, pageSize]);

  const handleNextPage = useCallback(() => {
    setPage((currentPage) => currentPage + 1);
  }, []);

  const handlePreviousPage = useCallback(() => {
    setPage((currentPage) => Math.max(0, currentPage - 1));
  }, []);

  const handleSetPageSize = useCallback(
    (newPageSize: number) => {
      // Calculate current first item index
      const currentFirstItem = page * pageSize;

      // Calculate new page number to keep showing same items
      const newPage = Math.floor(currentFirstItem / newPageSize);

      setPageSize(newPageSize);
      setPage(newPage);
    },
    [page, pageSize],
  );

  const tablePagination = useMemo(
    (): GenericTablePaginationSpec => ({
      page,
      total,
      pageSize,
      pageSizeOptions: [10, 25, 50, 100],
      hasNext: (page + 1) * pageSize < total,
      hasPrevious: page > 0,
      setPageSize: handleSetPageSize,
      onNextPage: handleNextPage,
      onPreviousPage: handlePreviousPage,
    }),
    [page, total, pageSize, handleSetPageSize, handleNextPage, handlePreviousPage],
  );

  // Adjust page to the last page if the skip is greater than the total
  useEffect(() => {
    if (skip > total) {
      const lastPage = Math.floor(total / pageSize);
      setPage(lastPage);
    }
  }, [skip, total, pageSize]);

  return useMemo(() => ({ pageSize, skip, tablePagination }), [pageSize, skip, tablePagination]);
};

export default useOffsetBasedPaginationState;
