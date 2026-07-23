import { memo } from 'react';
import { useTranslation } from '@rbx/intl';
import { TableBody, TableCell, TableHead, TableRow } from '@rbx/ui';
import SortableTableHeader from '@modules/monetization-shared/table-sort/SortableTableHeader';
import TableBase from '@modules/monetization-shared/table-v1/TableBase';
import type { SortableColumn, SortOrder } from '../types';
import { ManagedProductsTableHeaderCheckbox } from './ManagedProductsTableCheckbox';

type TableBaseContainerProps = {
  children: React.ReactNode;
  /** Whether to render the table without the surrounding rounded border */
  borderless?: boolean;
  /** Whether to show the last 30 day revenue column */
  showRevenue?: boolean;
};

// When sort is permanently disabled, we don't need to pass in any sort props
type TableBasePropsWithoutSort = TableBaseContainerProps & {
  disableSort: true;
  sortColumn?: never;
  sortOrder?: never;
  onSort?: never;
};

// When sort may be enabled, we need to pass in the sort props
type TableBasePropsWithSort = TableBaseContainerProps & {
  disableSort?: boolean;
  sortColumn?: SortableColumn;
  sortOrder: SortOrder;
  onSort: (column: SortableColumn) => void;
};

type TableBaseProps = TableBasePropsWithoutSort | TableBasePropsWithSort;

function ManagedProductsTableBase({
  sortColumn,
  sortOrder = 'default',
  disableSort,
  onSort,
  children,
  borderless,
  showRevenue,
}: TableBaseProps) {
  const { translate } = useTranslation();

  return (
    <TableBase borderless={borderless}>
      <TableHead>
        <TableRow>
          <TableCell padding='checkbox' align='center' className='padding-x-xlarge padding-y-large'>
            <ManagedProductsTableHeaderCheckbox
              aria-label={translate(
                'Action.SelectAllEligibleProducts' /* TranslationNamespace.ManagedPricing */,
              )}
            />
          </TableCell>

          <SortableTableHeader
            column='name'
            label={translate('Label.Name' /* TranslationNamespace.ManagedPricing */)}
            width='37.5%'
            sx={{ minWidth: '270px' }}
            disabled={disableSort}
            onSort={onSort}
            activeColumn={sortColumn}
            sortOrder={sortOrder}
          />

          {!showRevenue && (
            <SortableTableHeader
              column='managedPricing'
              label={translate('Label.ManagedPricing' /* TranslationNamespace.ManagedPricing */)}
              sx={{ minWidth: '170px' }}
              disabled={disableSort}
              onSort={onSort}
              activeColumn={sortColumn}
              sortOrder={sortOrder}
            />
          )}

          <SortableTableHeader
            column='price'
            label={translate('Label.CurrentPrice' /* TranslationNamespace.ManagedPricing */)}
            sx={{ minWidth: '145px' }}
            disabled={disableSort}
            onSort={onSort}
            activeColumn={sortColumn}
            sortOrder={sortOrder}
          />

          {showRevenue && (
            // We will not support sorting in this column
            <TableCell sx={{ minWidth: '160px' }}>
              <span className='text-label-medium'>
                {translate('Label.RevenueLast30Days' /* TranslationNamespace.ManagedPricing */)}
              </span>
            </TableCell>
          )}

          <SortableTableHeader
            column='lastUpdated'
            label={translate('Label.LastUpdated' /* TranslationNamespace.ManagedPricing */)}
            sx={{ minWidth: '145px' }}
            disabled={disableSort}
            onSort={onSort}
            activeColumn={sortColumn}
            sortOrder={sortOrder}
          />
        </TableRow>
      </TableHead>

      <TableBody>{children}</TableBody>
    </TableBase>
  );
}

export default memo(ManagedProductsTableBase);
