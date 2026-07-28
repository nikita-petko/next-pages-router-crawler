import { memo } from 'react';
import { useTranslation } from '@rbx/intl';
import { TableBody, TableCell, TableHead, TableRow } from '@rbx/ui';
import SortableTableHeader from '@modules/monetization-shared/table-sort/SortableTableHeader';
import type { SortOrder } from '@modules/monetization-shared/table-sort/types';
import TableBase from '@modules/monetization-shared/table-v1/TableBase';
import type { SortableColumn } from '../types';
import { DeveloperProductsTableHeaderCheckbox } from './DeveloperProductsTableCheckbox';

type BaseProps = {
  showPriceOptimization?: boolean;
  showManagedPricing?: boolean;
  showArchived?: boolean;
};

type PropsWithSort = BaseProps & {
  disableSort?: boolean;
  sortColumn?: SortableColumn;
  sortOrder: SortOrder;
  onSort: (column: SortableColumn) => void;
};

type PropsWithoutSort = BaseProps & {
  disableSort: true;
  sortColumn?: never;
  sortOrder?: never;
  onSort?: never;
};

type Props = PropsWithSort | PropsWithoutSort;

function DeveloperProductsTableBase({
  showPriceOptimization,
  showManagedPricing,
  showArchived,
  sortColumn,
  sortOrder,
  disableSort,
  onSort,
  children,
}: React.PropsWithChildren<Props>) {
  const { translate } = useTranslation();

  return (
    // NOTE: rbx/ui tables by default use table-layout: fixed
    <TableBase>
      <TableHead>
        <TableRow>
          <TableCell padding='checkbox' align='center' className='padding-x-xlarge padding-y-large'>
            <DeveloperProductsTableHeaderCheckbox
              aria-label={translate('Action.SelectAllEligibleProducts')}
            />
          </TableCell>

          <SortableTableHeader
            column='name'
            label={translate('Label.Name')}
            width='35%'
            sx={{ minWidth: '250px' }}
            disabled={disableSort}
            activeColumn={sortColumn}
            sortOrder={sortOrder}
            onSort={onSort}
          />

          <SortableTableHeader
            column='productId'
            label={translate('Label.ProductID')}
            sx={{ minWidth: '150px' }}
            disabled={disableSort}
            onSort={onSort}
            activeColumn={sortColumn}
            sortOrder={sortOrder}
          />

          {!showArchived && (
            <SortableTableHeader
              column='price'
              label={translate('Label.CurrentPrice')}
              sx={{ minWidth: '145px' }}
              disabled={disableSort}
              onSort={onSort}
              activeColumn={sortColumn}
              sortOrder={sortOrder}
            />
          )}

          {!showArchived && showManagedPricing && (
            <SortableTableHeader
              column='managedPricing'
              label={translate('Label.ManagedPricing')}
              sx={{ minWidth: '170px' }}
              disabled={disableSort}
              onSort={onSort}
              activeColumn={sortColumn}
              sortOrder={sortOrder}
            />
          )}

          {!showArchived && !showManagedPricing && (
            <SortableTableHeader
              column='regionalPricing'
              label={translate('Label.RegionalPricing')}
              tooltipDescription={translate('Tooltip.RegionalPricingForProducts')}
              sx={{ minWidth: '190px' }}
              disabled={disableSort}
              onSort={onSort}
              activeColumn={sortColumn}
              sortOrder={sortOrder}
            />
          )}

          {!showArchived && !showManagedPricing && showPriceOptimization && (
            <SortableTableHeader
              column='priceOptimization'
              label={translate('Label.PriceOptimization')}
              tooltipDescription={translate('Tooltip.PriceOptimizationForProducts')}
              sx={{ minWidth: '200px' }}
              disabled={disableSort}
              onSort={onSort}
              activeColumn={sortColumn}
              sortOrder={sortOrder}
            />
          )}

          {showArchived && (
            <SortableTableHeader
              column='archivedDate'
              label={translate('Label.ArchivedDate')}
              sx={{ minWidth: '160px' }}
              disabled={disableSort}
              onSort={onSort}
              activeColumn={sortColumn}
              sortOrder={sortOrder}
            />
          )}

          <TableCell padding='checkbox' sx={{ minWidth: '52px' }} align='center' />
        </TableRow>
      </TableHead>

      <TableBody>{children}</TableBody>
    </TableBase>
  );
}

export default memo(DeveloperProductsTableBase);
