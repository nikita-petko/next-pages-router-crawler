import type { FunctionComponent } from 'react';
import { useCallback, useMemo } from 'react';
import { TablePagination } from '@rbx/foundation-ui';

export type DevelopmentItemsPaginationLabels = {
  firstPage: string;
  lastPage: string;
  nextPage: string;
  previousPage: string;
  range: (start: number, end: number, total: number, hasNextPage: boolean) => string;
  rowsPerPage: string;
};

export type DevelopmentItemsPaginationProps = {
  hasNextPage: boolean;
  itemCount: number;
  labels: DevelopmentItemsPaginationLabels;
  onPageChange: (page: number, pageToken?: string) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
  page: number;
  pageSize: number;
  pageTokens: ReadonlyMap<number, string | undefined>;
  rowsPerPageOptions: readonly number[];
};

const getEstimatedTotalRows = (
  page: number,
  pageSize: number,
  itemCount: number,
  hasNextPage: boolean,
) => (hasNextPage ? (page + 2) * pageSize - 1 : page * pageSize + itemCount);

const DevelopmentItemsPagination: FunctionComponent<DevelopmentItemsPaginationProps> = ({
  hasNextPage,
  itemCount,
  labels,
  onPageChange,
  onRowsPerPageChange,
  page,
  pageSize,
  pageTokens,
  rowsPerPageOptions,
}) => {
  const { range } = labels;
  const mutableRowsPerPageOptions = useMemo(() => [...rowsPerPageOptions], [rowsPerPageOptions]);
  const rangeLabel = useCallback(
    (start: number, end: number, total: number) => range(start, end, total, hasNextPage),
    [hasNextPage, range],
  );
  const handlePageChange = useCallback(
    (nextPage: number) => {
      if (nextPage === page) {
        return;
      }
      const token = pageTokens.get(nextPage);
      if (nextPage > 0 && token == null) {
        return;
      }
      onPageChange(nextPage, token);
    },
    [onPageChange, page, pageTokens],
  );

  if (itemCount === 0 && page === 0 && !hasNextPage) {
    return null;
  }

  const rangeEnd = page * pageSize + itemCount;
  const totalRows = Math.max(
    getEstimatedTotalRows(page, pageSize, itemCount, hasNextPage),
    rangeEnd,
  );

  return (
    <div className='width-full min-width-0 scroll-x padding-top-large'>
      <TablePagination
        className='!padding-x-none max-width-full'
        firstPageLabel={labels.firstPage}
        lastPageLabel={labels.lastPage}
        nextPageLabel={labels.nextPage}
        onPageChange={handlePageChange}
        onRowsPerPageChange={onRowsPerPageChange}
        page={page}
        previousPageLabel={labels.previousPage}
        rangeLabel={rangeLabel}
        rowsPerPage={pageSize}
        rowsPerPageLabel={labels.rowsPerPage}
        rowsPerPageOptions={mutableRowsPerPageOptions}
        size='Medium'
        totalRows={totalRows}
      />
    </div>
  );
};

export default DevelopmentItemsPagination;
