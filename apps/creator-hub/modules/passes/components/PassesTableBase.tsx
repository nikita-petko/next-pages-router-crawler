import { memo } from 'react';
import { useTranslationWithNamespace } from '@rbx/intl';
import { TableBody, TableCell, TableHead, TableRow } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import SortableTableHeader from '@modules/monetization-shared/table-sort/SortableTableHeader';
import type { SortOrder } from '@modules/monetization-shared/table-sort/types';
import TableBase from '@modules/monetization-shared/table-v1/TableBase';
import type { SortableColumn } from '../types';
import { PassesTableHeaderCheckbox } from './PassesTableCheckbox';

type Props = {
  showArchived?: boolean;
  sortColumn: SortableColumn | undefined;
  sortOrder: SortOrder;
  onSort: (column: SortableColumn) => void;
};

function PassesTableBase({
  showArchived,
  sortColumn,
  sortOrder,
  onSort,
  children,
}: React.PropsWithChildren<Props>) {
  const { translate } = useTranslationWithNamespace(TranslationNamespace.Creations);

  return (
    <TableBase>
      <TableHead>
        <TableRow>
          <TableCell padding='checkbox' align='center' className='padding-x-xlarge padding-y-large'>
            <PassesTableHeaderCheckbox aria-label={translate('Action.SelectAllEligibleProducts')} />
          </TableCell>

          <SortableTableHeader
            column='name'
            label={translate('Heading.Name')}
            width='35%'
            sx={{ minWidth: '250px' }}
            activeColumn={sortColumn}
            sortOrder={sortOrder}
            onSort={onSort}
          />

          <SortableTableHeader
            column='passId'
            label={translate('Heading.PassID')}
            sx={{ minWidth: '150px' }}
            activeColumn={sortColumn}
            sortOrder={sortOrder}
            onSort={onSort}
          />

          {!showArchived && (
            <SortableTableHeader
              column='price'
              label={translate('Heading.CurrentPrice')}
              sx={{ minWidth: '145px' }}
              activeColumn={sortColumn}
              sortOrder={sortOrder}
              onSort={onSort}
            />
          )}

          {!showArchived && (
            <SortableTableHeader
              column='managedPricing'
              label={translate('Label.ManagedPricing')}
              sx={{ minWidth: '170px' }}
              activeColumn={sortColumn}
              sortOrder={sortOrder}
              onSort={onSort}
            />
          )}

          {showArchived && (
            <SortableTableHeader
              column='archivedDate'
              label={translate('Label.ArchivedDate')}
              sx={{ minWidth: '160px' }}
              activeColumn={sortColumn}
              sortOrder={sortOrder}
              onSort={onSort}
            />
          )}

          <TableCell padding='checkbox' sx={{ minWidth: '52px' }} align='center' />
        </TableRow>
      </TableHead>
      <TableBody>{children}</TableBody>
    </TableBase>
  );
}

export default memo(PassesTableBase);
