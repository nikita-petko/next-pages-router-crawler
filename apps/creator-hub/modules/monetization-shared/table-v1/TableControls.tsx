import { memo } from 'react';
import { clsx } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { TablePagination, type TTablePaginationProps } from '@rbx/ui';

export type TTableControlsProps = Pick<
  TTablePaginationProps,
  | 'count'
  | 'page'
  | 'rowsPerPage'
  | 'onPageChange'
  | 'onRowsPerPageChange'
  | 'rowsPerPageOptions'
  | 'className'
> & {
  numSelected?: number;
  maxSelectable?: number;
  maxDisplayedCount?: number;
};

const MAX_DISPLAYED_COUNT = 999;

const displayTotalCount = (count: number, maxDisplayedCount: number) =>
  count > maxDisplayedCount ? `${maxDisplayedCount}+` : count.toString();

const MemoizedTablePagination = memo(
  ({
    count,
    maxDisplayedCount,
    ...props
  }: Omit<TTableControlsProps, 'numSelected' | 'maxSelectable'>) => {
    const { translate } = useTranslation();

    return (
      <TablePagination
        component='div'
        {...props}
        count={count}
        labelRowsPerPage={translate('Label.RowsPerPage')}
        labelDisplayedRows={({ from, to }) =>
          translate('Label.PageRange', {
            pageRange: `${from}–${to}`,
            totalPageCount: displayTotalCount(count, maxDisplayedCount ?? MAX_DISPLAYED_COUNT),
          })
        }
      />
    );
  },
);
MemoizedTablePagination.displayName = 'MemoizedTablePagination';

/**
 * Controls to display pagination and item selection information for a table.
 * Exposes WebBlox (MUI) `TablePagination` component with additional localization and display count support.
 *
 * If `numSelected` is not provided, only pagination controls will be displayed.
 *
 * @example
 * ```tsx
 * import { TableControls } from '@modules/monetization-shared/table-v1';
 *
 * return (
 *   <TableControls
 *    numSelected={10}
 *    maxSelectable={100}
 *    count={1000}
 *    page={0}
 *    rowsPerPage={10}
 *    rowsPerPageOptions={[10, 20, 50]}
 *    onPageChange={() => {}}
 *    onRowsPerPageChange={() => {}}
 *    className='padding-y-small'
 *   />
 * );
 * ```
 */
function TableControls({
  className,
  numSelected,
  maxSelectable,
  maxDisplayedCount = MAX_DISPLAYED_COUNT,
  count,
  page,
  rowsPerPage,
  rowsPerPageOptions,
  onPageChange,
  onRowsPerPageChange,
}: TTableControlsProps) {
  const { translate } = useTranslation();
  const showSelected = numSelected !== undefined;

  return (
    <div
      className={clsx(
        'flex items-center',
        showSelected ? 'justify-between' : 'justify-end',
        className,
      )}>
      {showSelected && (
        <span className='padding-x-small text-no-wrap'>
          {translate('Label.NumSelected', {
            numSelected: numSelected.toString(),
            numTotal: displayTotalCount(maxSelectable ?? count, maxDisplayedCount),
          })}
        </span>
      )}
      <MemoizedTablePagination
        count={count}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
        rowsPerPageOptions={rowsPerPageOptions}
        maxDisplayedCount={maxDisplayedCount}
      />
    </div>
  );
}

// TODO: add num selected label to translation and isolate
export default memo(TableControls);
