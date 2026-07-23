import { TablePagination, type TTableSize } from '@rbx/foundation-ui';
import { type ReactElement, useCallback } from 'react';

import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';

const DEFAULT_ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100, 150, 200];

interface FoundationTablePaginationProps {
  className?: string;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
  page: number;
  rowsPerPage: number;
  rowsPerPageOptions?: number[];
  size?: TTableSize;
  totalRows: number;
}

/**
 * Localized wrapper around the Foundation UI `TablePagination`. Centralizes the
 * translated button aria-labels, rows-per-page label, and range label so each
 * table consumer just supplies data + handlers. Foundation resets the page to 0
 * internally when the rows-per-page value changes, so callers only need to wire
 * their setters.
 */
const FoundationTablePagination = ({
  className,
  onPageChange,
  onRowsPerPageChange,
  page,
  rowsPerPage,
  rowsPerPageOptions = DEFAULT_ROWS_PER_PAGE_OPTIONS,
  size,
  totalRows,
}: FoundationTablePaginationProps): ReactElement => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Misc);

  const rangeLabel = useCallback(
    (start: number, end: number, total: number): string =>
      translate('Label.PaginationDisplayedRows', {
        count: String(total),
        from: String(start),
        to: String(end),
      }),
    [translate],
  );

  return (
    <TablePagination
      className={className}
      firstPageLabel={translate('Label.FirstPage')}
      lastPageLabel={translate('Label.LastPage')}
      nextPageLabel={translate('Label.NextPage')}
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
      page={page}
      previousPageLabel={translate('Label.PreviousPage')}
      rangeLabel={rangeLabel}
      rowsPerPage={rowsPerPage}
      rowsPerPageLabel={translate('Label.RowsPerPage')}
      rowsPerPageOptions={rowsPerPageOptions}
      size={size}
      totalRows={totalRows}
    />
  );
};

export default FoundationTablePagination;
