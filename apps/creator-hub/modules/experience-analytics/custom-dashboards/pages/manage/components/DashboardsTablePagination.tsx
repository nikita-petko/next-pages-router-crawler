import { type FC, useCallback } from 'react';
import GenericTablePagination, {
  unknownDueToCursorBasedPagination,
} from '@modules/charts-generic/tables/GenericTablePagination';
import { MANAGE_PAGE_SIZE_OPTIONS } from '../hooks/useManagePageState';

/**
 * Manage-page adapter around the shared Error Reports table pagination
 * (`GenericTablePagination`): 1-based page indexes, loading `disabled`, and
 * cursor lists that have no total count.
 */
type DashboardsTablePaginationProps = {
  readonly page: number;
  readonly pageSize: number;
  readonly totalPages: number;
  readonly totalCount?: number;
  readonly disabled?: boolean;
  readonly onPageChange: (next: number) => void;
  readonly onPageSizeChange: (next: number) => void;
};

const ManagePageSizeOptions: number[] = [...MANAGE_PAGE_SIZE_OPTIONS];
const FirstPage = 1;

const DashboardsTablePagination: FC<DashboardsTablePaginationProps> = ({
  page,
  pageSize,
  totalPages,
  totalCount,
  disabled = false,
  onPageChange,
  onPageSizeChange,
}) => {
  const onNextPage = useCallback(() => {
    onPageChange(Math.min(totalPages, page + 1));
  }, [onPageChange, page, totalPages]);

  const onPreviousPage = useCallback(() => {
    onPageChange(Math.max(FirstPage, page - 1));
  }, [onPageChange, page]);

  return (
    <GenericTablePagination
      page={page - FirstPage}
      pageSize={pageSize}
      pageSizeOptions={ManagePageSizeOptions}
      total={totalCount ?? unknownDueToCursorBasedPagination}
      hasNext={!disabled && page < totalPages}
      hasPrevious={!disabled && page > FirstPage}
      onNextPage={onNextPage}
      onPreviousPage={onPreviousPage}
      setPageSize={onPageSizeChange}
      disabled={disabled}
    />
  );
};

export default DashboardsTablePagination;
