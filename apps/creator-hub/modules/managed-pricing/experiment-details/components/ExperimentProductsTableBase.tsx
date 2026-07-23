/* istanbul ignore file */
import { memo } from 'react';
import { useTranslation } from '@rbx/intl';
import { TableBody, TableHead, TableRow } from '@rbx/ui';
import TableBase from '@modules/monetization-shared/table-v1/TableBase';
import SortableTableHeader from '@modules/monetization-shared/table-sort/SortableTableHeader';
import type { SortOrder } from '@modules/monetization-shared/table-sort/types';
import type { ExperimentSortableColumn } from '../types';

type TableBaseContainerProps = {
  children: React.ReactNode;
  showOptimization: boolean;
};

type TableBasePropsWithoutSort = TableBaseContainerProps & {
  disableSort: true;
  sortColumn?: never;
  sortOrder?: never;
  onSort?: never;
};

type TableBasePropsWithSort = TableBaseContainerProps & {
  disableSort?: boolean;
  sortColumn?: ExperimentSortableColumn;
  sortOrder: SortOrder;
  onSort: (column: ExperimentSortableColumn) => void;
};

type TableBaseProps = TableBasePropsWithoutSort | TableBasePropsWithSort;

function ExperimentProductsTableBase({
  sortColumn,
  sortOrder = 'default',
  disableSort,
  onSort,
  children,
  showOptimization,
}: TableBaseProps) {
  const { translate } = useTranslation();

  return (
    <TableBase>
      <TableHead>
        <TableRow>
          <SortableTableHeader
            column='name'
            label={translate('Label.Name' /* TranslationNamespace.ManagedPricing */)}
            width='35%'
            sx={{ minWidth: '270px' }}
            disabled={disableSort}
            onSort={onSort}
            activeColumn={sortColumn}
            sortOrder={sortOrder}
          />

          <SortableTableHeader
            column='type'
            label={translate('Label.Type' /* TranslationNamespace.Creations */)}
            sx={{ minWidth: '130px' }}
            disabled={disableSort}
            onSort={onSort}
            activeColumn={sortColumn}
            sortOrder={sortOrder}
          />

          {showOptimization && (
            <SortableTableHeader
              column='optimization'
              label={translate('Label.Optimization' /* TranslationNamespace.ManagedPricing */)}
              sx={{ minWidth: '130px' }}
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

          <SortableTableHeader
            column='optimizedPrice'
            label={translate('Label.OptimizedPrice' /* TranslationNamespace.ManagedPricing */)}
            className='bg-shift-200'
            sx={{ minWidth: '165px' }}
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

export default memo(ExperimentProductsTableBase);
