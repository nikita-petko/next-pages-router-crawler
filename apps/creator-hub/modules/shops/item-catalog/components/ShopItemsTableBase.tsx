import { memo } from 'react';
import { useTranslation } from '@rbx/intl';
import { TableBody, TableCell, TableHead, TableRow } from '@rbx/ui';
import SortableTableHeader from '@modules/monetization-shared/table-sort/SortableTableHeader';
import TableBase from '@modules/monetization-shared/table-v1/TableBase';
import type { SortOrder, SortableShopItemColumn } from '../../types';
import { ShopItemsTableHeaderCheckbox } from './ShopItemsTableCheckbox';

type Props = {
  sortColumn?: SortableShopItemColumn;
  sortOrder: SortOrder;
  onSort: (column: SortableShopItemColumn) => void;
  /** Disables every sortable column header until all items are loaded. */
  disableSort?: boolean;
  children: React.ReactNode;
};

function ShopItemsTableBase({ sortColumn, sortOrder, onSort, disableSort, children }: Props) {
  const { translate } = useTranslation();

  return (
    <TableBase>
      <TableHead>
        <TableRow>
          <TableCell padding='checkbox' align='center' className='padding-x-xlarge padding-y-large'>
            <ShopItemsTableHeaderCheckbox
              aria-label={translate('Label.AriaLabel.SelectAllItems')}
            />
          </TableCell>

          <SortableTableHeader
            column='name'
            label={translate('Label.Name')}
            width='37.5%'
            sx={{ minWidth: '240px' }}
            disabled={disableSort}
            onSort={onSort}
            activeColumn={sortColumn}
            sortOrder={sortOrder}
          />

          <SortableTableHeader
            column='type'
            label={translate('Label.Type')}
            sx={{ minWidth: '160px' }}
            disabled={disableSort}
            onSort={onSort}
            activeColumn={sortColumn}
            sortOrder={sortOrder}
          />

          {/* Visibility badge in the row is min-width 160px; cell padding + header
              label + sort arrow need a wider column to keep the header inline. */}
          <SortableTableHeader
            column='isVisibleInShop'
            label={translate('Label.Listed')}
            sx={{ minWidth: '200px' }}
            disabled={disableSort}
            onSort={onSort}
            activeColumn={sortColumn}
            sortOrder={sortOrder}
          />

          <SortableTableHeader
            column='category'
            label={translate('Label.Category')}
            sx={{ minWidth: '160px', maxWidth: '320px' }}
            disabled={disableSort}
            onSort={onSort}
            activeColumn={sortColumn}
            sortOrder={sortOrder}
          />

          <TableCell padding='checkbox' sx={{ minWidth: '52px' }} align='center' />
        </TableRow>
      </TableHead>

      <TableBody>{children}</TableBody>
    </TableBase>
  );
}

export default memo(ShopItemsTableBase);
