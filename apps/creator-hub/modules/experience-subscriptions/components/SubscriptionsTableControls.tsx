import { memo } from 'react';
import { clsx } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { TablePagination, type TTablePaginationProps } from '@rbx/ui';

type Props = Pick<
  TTablePaginationProps,
  | 'count'
  | 'page'
  | 'rowsPerPage'
  | 'onPageChange'
  | 'onRowsPerPageChange'
  | 'rowsPerPageOptions'
  | 'className'
>;

const MAX_DISPLAYED_COUNT = 999;

const displayTotalCount = (count: number, maxDisplayedCount: number) =>
  count > maxDisplayedCount ? `${maxDisplayedCount}+` : count.toString();

function SubscriptionsTableControls({
  className,
  count,
  page,
  rowsPerPage,
  rowsPerPageOptions,
  onPageChange,
  onRowsPerPageChange,
}: Props) {
  const { translate } = useTranslation();

  return (
    <div className={clsx('flex justify-end items-center', className)}>
      <TablePagination
        component='div'
        rowsPerPageOptions={rowsPerPageOptions}
        count={count}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
        labelRowsPerPage={translate('Label.RowsPerPage')}
        labelDisplayedRows={({ from, to }) =>
          translate('Label.PageRange', {
            pageRange: `${from}–${to}`,
            totalPageCount: displayTotalCount(count, MAX_DISPLAYED_COUNT),
          })
        }
      />
    </div>
  );
}

export default memo(SubscriptionsTableControls);
