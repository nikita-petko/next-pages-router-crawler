import { memo, type ReactNode } from 'react';
import { useTranslation } from '@rbx/intl';
import { TableBody, TableHead, TableRow } from '@rbx/ui';
import SortableTableHeader from '@modules/monetization-shared/table-sort/SortableTableHeader';
import type { SortOrder } from '@modules/monetization-shared/table-sort/types';
import TableBase from '@modules/monetization-shared/table-v1/TableBase';
import type { ExternalEligibilityReportSortColumn } from '../utils/sortExternalEligibilityReportItems';

type Props = {
  sortColumn?: ExternalEligibilityReportSortColumn;
  sortOrder: SortOrder;
  onSort: (column: ExternalEligibilityReportSortColumn) => void;
  children: ReactNode;
};

function ExternalEligibilityReportTableBase({ sortColumn, sortOrder, onSort, children }: Props) {
  const { translate } = useTranslation();

  return (
    <TableBase>
      <TableHead>
        <TableRow>
          <SortableTableHeader
            column='name'
            label={translate('Label.Name')}
            width='50%'
            className='min-width-[240px]'
            activeColumn={sortColumn}
            sortOrder={sortOrder}
            onSort={onSort}
          />
          <SortableTableHeader
            column='id'
            label={translate('Label.ProductID')}
            className='min-width-[160px]'
            activeColumn={sortColumn}
            sortOrder={sortOrder}
            onSort={onSort}
          />
        </TableRow>
      </TableHead>
      <TableBody>{children}</TableBody>
    </TableBase>
  );
}

export default memo(ExternalEligibilityReportTableBase);
