import { useState } from 'react';

const DEFAULT_ROWS_PER_PAGE = 5;

type UsePaginationConfig = {
  initialRowsPerPage?: number;
};

export type UsePaginationState = {
  page: number;
  rowsPerPage: number;
};

export type UsePaginationActions = {
  setPage: (value: number) => void;
  setRowsPerPage: (value: number) => void;
};

export const usePagination = ({
  initialRowsPerPage = DEFAULT_ROWS_PER_PAGE,
}: UsePaginationConfig = {}): UsePaginationState & UsePaginationActions => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);

  return {
    page,
    rowsPerPage,
    setPage,
    setRowsPerPage,
  };
};

export default usePagination;
