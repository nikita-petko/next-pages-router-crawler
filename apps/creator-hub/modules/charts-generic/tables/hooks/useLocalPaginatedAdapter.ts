import { useCallback, useMemo, useState, useEffect } from 'react';

// Create fake pagination with local data
const useLocalPaginatedAdapter = <T>(data: T[], initialPageSize: number = 10) => {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const paginatedData = useMemo(() => {
    const start = page * pageSize;
    const end = start + pageSize;
    return data.slice(start, end);
  }, [data, page, pageSize]);

  useEffect(() => {
    setPage(0);
  }, [data]);

  const total = useMemo(() => data.length, [data]);

  const onNextPage = useCallback(() => {
    setPage((prev) => prev + 1);
  }, []);

  const onPreviousPage = useCallback(() => {
    setPage((prev) => Math.max(0, prev - 1));
  }, []);

  const setPageSizeCallback = useCallback(
    (newPageSize: number) => {
      setPageSize(newPageSize);
      setPage((currentPage) => Math.floor((currentPage * pageSize) / newPageSize));
    },
    [pageSize],
  );

  const hasNext = useMemo(() => page * pageSize + pageSize < total, [page, pageSize, total]);

  const hasPrevious = useMemo(() => page > 0, [page]);

  return {
    paginatedData,
    page,
    pageSize,
    total,
    onNextPage,
    onPreviousPage,
    setPageSize: setPageSizeCallback,
    hasNext,
    hasPrevious,
  };
};

export default useLocalPaginatedAdapter;
