import { PaginationProps } from '@modules/miscellaneous/common';
import { useCallback, useRef, useState } from 'react';

// useCursorPagination keeps track of a cursor for a paginated API
const useCursorPagination = (rowsPerPage = [10, 20, 50, 100]) => {
  // keep track of the next page token for each page
  // this allows us to use the back button.
  const mapPageToNextCursor = useRef<{ [page: number]: string | undefined }>({});

  // Use state for pageIndex and pageSize which change using TablePagination
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: rowsPerPage[0],
  });

  // This is called when you change the number of rows per page.
  const onRowsPerPageChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setPagination({
      pageSize: parseInt(event.target.value, 10) || rowsPerPage[0],
      // when the number of rows change, we have to recalculate the dynamodb nextpagetoken
      // so we have to set the page back to 0.
      pageIndex: 0,
    });
    mapPageToNextCursor.current = {};
  };

  // This is called when you click the next/previous button in pagination.
  // Random access pagination is not supported in this page.
  const onPageChange = (page: number, currentToken: string | undefined) =>
    setPagination((prev) => {
      mapPageToNextCursor.current[prev.pageIndex] = currentToken;

      return {
        ...prev,
        pageIndex: page,
      };
    });

  // this is the "current" pageToken, which is the one we used to get the current page (the current page minus 1)
  // "nextPageToken" is the token we need to use on the next api request.
  const pageToken = mapPageToNextCursor.current[pagination.pageIndex - 1];

  const reset = useCallback(() => {
    setPagination({
      pageIndex: 0,
      pageSize: pagination.pageSize,
    });
  }, [pagination.pageSize]);
  return {
    pagination,
    rowsPerPage,
    pageToken,
    onRowsPerPageChange,
    onPageChange,
    reset,
  };
};

export const usePaginationProps = (
  nextPageToken: string | undefined,
  curPageIndex: number,
  onPageChange: (page: number, currentToken: string | undefined) => void,
  loading: boolean,
) => {
  const paginationProps: PaginationProps = {
    canLoadNextPage: () => !loading && !!nextPageToken,
    canLoadPreviousPage: () => !loading && curPageIndex > 0,
    currentPage: curPageIndex + 1,
    loadNextPage: () => onPageChange(curPageIndex + 1, nextPageToken),
    loadPreviousPage: () => onPageChange(curPageIndex - 1, nextPageToken),
  };

  return { paginationProps };
};

export default useCursorPagination;
