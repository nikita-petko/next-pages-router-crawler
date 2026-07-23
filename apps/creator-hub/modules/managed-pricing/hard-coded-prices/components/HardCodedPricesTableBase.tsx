/* istanbul ignore file */
import { memo } from 'react';
import { TableBody, TableCell, TableHead, TableRow } from '@rbx/ui';
import TableBase from '@modules/monetization-shared/table-v1/TableBase';
import SortableTableHeader from '@modules/monetization-shared/table-sort/SortableTableHeader';
import type { SortOrder } from '@modules/monetization-shared/table-sort/types';
import { SortableColumn } from '../types';

// TODO: add translations once schema is finalized

type Props = {
  direction: SortOrder;
  sortColumn: SortableColumn | undefined;
  onSort: (column: SortableColumn) => void;
  disableSort?: boolean;
};

function HardCodedPricesTableBase({
  direction,
  sortColumn,
  onSort,
  disableSort,
  children,
}: React.PropsWithChildren<Props>) {
  return (
    <TableBase>
      <TableHead>
        <TableRow>
          <SortableTableHeader
            column='filename'
            label='File name'
            sx={{ minWidth: '250px' }}
            activeColumn={sortColumn}
            sortOrder={direction}
            onSort={onSort}
            disabled={disableSort}
          />

          <TableCell sx={{ minWidth: '100px' }}>
            <span className='text-label-medium'>Line item</span>
          </TableCell>

          <TableCell width='40%' sx={{ minWidth: '300px' }}>
            <span className='text-label-medium'>Code</span>
          </TableCell>

          {/* Studio Launcher */}
          <TableCell sx={{ minWidth: '160px' }} />

          {/* Dismiss / More Actions */}
          <TableCell padding='checkbox' align='center' sx={{ minWidth: '64px' }} />
        </TableRow>
      </TableHead>

      <TableBody>{children}</TableBody>
    </TableBase>
  );
}

export default memo(HardCodedPricesTableBase);
