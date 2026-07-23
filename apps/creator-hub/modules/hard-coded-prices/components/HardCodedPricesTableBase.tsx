import { memo } from 'react';
import { useTranslation } from '@rbx/intl';
import { TableBody, TableCell, TableHead, TableRow } from '@rbx/ui';
import SortableTableHeader from '@modules/monetization-shared/table-sort/SortableTableHeader';
import type { SortOrder } from '@modules/monetization-shared/table-sort/types';
import TableBase from '@modules/monetization-shared/table-v1/TableBase';
import type { SortableColumn } from '../types';

type TableBasePropsWithoutSort = {
  disableSort: true;
  sortColumn?: never;
  sortOrder?: never;
  onSort?: never;
};

type TableBasePropsWithSort = {
  disableSort?: boolean;
  sortColumn?: SortableColumn;
  sortOrder: SortOrder;
  onSort: (column: SortableColumn) => void;
};

function HardCodedPricesTableBase({
  sortColumn,
  sortOrder,
  onSort,
  disableSort,
  children,
}: React.PropsWithChildren<TableBasePropsWithoutSort | TableBasePropsWithSort>) {
  const { translate } = useTranslation();

  return (
    <TableBase>
      <TableHead>
        <TableRow>
          <SortableTableHeader
            column='filename'
            label={translate('Label.FileName')}
            sx={{ minWidth: '250px' }}
            activeColumn={sortColumn}
            sortOrder={sortOrder}
            onSort={onSort}
            disabled={disableSort}
          />

          <TableCell sx={{ minWidth: '100px' }}>
            <span className='text-label-medium'>{translate('Label.LineItem')}</span>
          </TableCell>

          <TableCell width='40%' sx={{ minWidth: '300px' }}>
            <span className='text-label-medium'>{translate('Label.Code')}</span>
          </TableCell>

          {/* Studio Launcher */}
          <TableCell sx={{ minWidth: '160px' }} />

          {/* TODO(@jeminpark): currently out of scope, but add dismiss action */}
          {/* Dismiss / More Actions */}
          <TableCell padding='checkbox' align='center' sx={{ minWidth: '64px' }} />
        </TableRow>
      </TableHead>

      <TableBody>{children}</TableBody>
    </TableBase>
  );
}

export default memo(HardCodedPricesTableBase);
