import type { FunctionComponent } from 'react';
import React, { useCallback } from 'react';
import { Grid, Pagination as UIPagination } from '@rbx/ui';
import usePaginationStyles from './Pagination.styles';

export interface PaginationProps {
  canLoadPreviousPage(): boolean;
  canLoadNextPage(): boolean;
  loadPreviousPage(): void;
  loadNextPage(): void;
  currentPage: number;
  onPageChange?(page: number): void;
  pageCount?: number;
}

const Pagination: FunctionComponent<React.PropsWithChildren<PaginationProps>> = ({
  canLoadPreviousPage,
  canLoadNextPage,
  loadPreviousPage,
  loadNextPage,
  onPageChange,
  currentPage,
  pageCount,
}) => {
  const {
    classes: { root },
  } = usePaginationStyles();
  const handlePageChange = useCallback(
    (_: React.ChangeEvent<unknown>, page: number) => {
      if (onPageChange) {
        onPageChange(page);
      }
    },
    [onPageChange],
  );

  if (typeof pageCount !== 'undefined') {
    return (
      <Grid
        container
        className={root}
        alignContent='center'
        alignItems='center'
        justifyContent='center'>
        <UIPagination
          count={pageCount}
          nextProps={{ disabled: !canLoadNextPage(), onClick: loadNextPage }}
          previousProps={{ disabled: !canLoadPreviousPage(), onClick: loadPreviousPage }}
          page={currentPage}
          onChange={handlePageChange}
        />
      </Grid>
    );
  }

  // Don't show pagination if there is only 1 page and no next page
  if (currentPage === 1 && !canLoadNextPage()) {
    return null;
  }

  return (
    <Grid
      container
      className={root}
      alignContent='center'
      alignItems='center'
      justifyContent='center'>
      <UIPagination
        variant='reduced'
        nextProps={{ disabled: !canLoadNextPage(), onClick: loadNextPage }}
        previousProps={{ disabled: !canLoadPreviousPage(), onClick: loadPreviousPage }}
        page={currentPage}
      />
    </Grid>
  );
};

export default Pagination;
