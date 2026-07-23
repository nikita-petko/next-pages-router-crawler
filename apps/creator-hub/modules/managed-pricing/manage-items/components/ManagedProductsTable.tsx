import { memo, useCallback, useMemo } from 'react';
import TableControls from '@modules/monetization-shared/table-v1/TableControls';
import type { TTableControlsProps } from '@modules/monetization-shared/table-v1/TableControls';
import { useTablePagination } from '@modules/monetization-shared/table-v1/useTablePagination';
import { useCurrentPage } from '@modules/monetization-shared/table-v1/useCurrentPage';
import TableFilterEmptyState from '@modules/monetization-shared/table-v1/TableFilterEmptyState';
import { BULK_UPDATE_LIMIT } from '@modules/developer-products/queries/constants';
import {
  TableSelectionProvider,
  useTableSelectionStoreInstance,
} from '@modules/monetization-shared/table-selection/context';
import { useSelectionStats } from '@modules/monetization-shared/table-selection/hooks';
import { useSortItems } from '@modules/monetization-shared/table-sort/useSortItems';
import { useTokenizedSearch } from '@modules/monetization-shared/useTokenizedSearch';
import { useTranslation } from '@rbx/intl';
import { pluralize } from '@modules/monetization-shared/pluralize';
import { toast } from '@modules/monetization-shared/snackbar/actions';
import { withDisableManagedPricingWarningDialog } from '../../dialogs/DisableManagedPricingWarningDialog';
import { useManagedProducts } from '../hooks/useManagedProducts';
import { useManagedProductsFilters } from '../hooks/useManagedProductsFilters';
import { useBatchUpdateManagedProductsStatus } from '../hooks/useBatchUpdateManagedProductsStatus';
import { sortManagedProducts } from '../utils/sortManagedProducts';
import type { BulkAction, ManagedProduct } from '../types';
import ManagedProductsTableBase from './ManagedProductsTableBase';
import ManagedProductsTableRow from './ManagedProductsTableRow';
import ManagedProductsActionBar from './ManagedProductsActionBar';

const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100];
const INITIAL_ROWS_PER_PAGE = ROWS_PER_PAGE_OPTIONS[0]; // 10
const MAX_SELECTABLE_LIMIT = BULK_UPDATE_LIMIT;

type Props = {
  universeId: number;
  initialRowsPerPage?: number;
  rowsPerPageOptions?: number[];
  selectionLimit?: number;
  perPageFetchLimit?: number;
};

const getManagedProductId = (product: ManagedProduct) => `${product.type}-${product.id}`;

function ManagedProductsTableControls(
  props: Omit<TTableControlsProps, 'numSelected' | 'maxSelectable'>,
) {
  const { numSelected } = useSelectionStats<string, ManagedProduct>();

  return <TableControls numSelected={numSelected} {...props} />;
}

function ManagedProductsTable({
  universeId,
  initialRowsPerPage = INITIAL_ROWS_PER_PAGE,
  rowsPerPageOptions = ROWS_PER_PAGE_OPTIONS,
  selectionLimit = MAX_SELECTABLE_LIMIT,
  perPageFetchLimit,
}: Props) {
  const { translate } = useTranslation();

  const {
    allProducts,
    developerProducts,
    gamePasses,
    isAllProductsLoaded,
    hasNextDevProductsPage,
    fetchNextDevProductsPage,
  } = useManagedProducts({ universeId, limit: perPageFetchLimit });

  const { typeFilter, setTypeFilter, statusFilter, setStatusFilter, filteredProducts } =
    useManagedProductsFilters({ products: allProducts, developerProducts, gamePasses });

  const {
    searchQuery,
    setSearchQuery,
    results: searchedProducts,
  } = useTokenizedSearch(filteredProducts, 'name');

  const { sortColumn, sortOrder, onSort, sortedItems } = useSortItems(searchedProducts, {
    sort: sortManagedProducts,
  });

  const hasActiveSearchOrFilter =
    searchQuery.trim().length > 0 || typeFilter !== null || statusFilter !== null;

  const showNoMatchingItemsEmptyState =
    allProducts.length > 0 && searchedProducts.length === 0 && hasActiveSearchOrFilter;

  const { page, rowsPerPage, onPageChange, onRowsPerPageChange } = useTablePagination({
    count: sortedItems.length,
    initialRowsPerPage,
  });

  const { currentPage } = useCurrentPage(sortedItems, {
    page,
    rowsPerPage,
    hasNextPage: typeFilter !== 'GamePass' && hasNextDevProductsPage,
    fetchNextPage: fetchNextDevProductsPage,
    fetchLimit: perPageFetchLimit,
  });

  const { mutateAsync: updateManagedProductsStatus, isPending } =
    useBatchUpdateManagedProductsStatus({ universeId });

  // Note: selection store is a singleton stable reference
  const selectionStore = useTableSelectionStoreInstance(
    { identifier: getManagedProductId },
    {
      currentPage,
      items: searchedProducts,
      mode: searchedProducts.length <= selectionLimit ? 'all' : 'page',
      limit: selectionLimit,
      disabled: isPending,
    },
  );

  const performBulkUpdate = useCallback(
    async (items: ManagedProduct[], enabled: boolean) => {
      const result = await updateManagedProductsStatus({ items, enabled });

      const successCount = items.length - result.errors.length;
      if (successCount > 0) {
        const message = pluralize(
          successCount,
          translate('Message.SuccessfullyUpdatedSingleItem'),
          translate('Message.SuccessfullyUpdatedMultipleItems', {
            count: successCount.toString(),
          }),
        );

        toast({ title: message });
      }
      selectionStore.reset();
    },
    [selectionStore, translate, updateManagedProductsStatus],
  );

  const handleBulkAction = useCallback(
    async (action: BulkAction) => {
      if (action === 'none') {
        return;
      }

      const selectedItems = selectionStore.getSelectedViewableItems();
      if (selectedItems.length === 0) {
        return;
      }

      if (action === 'disabling') {
        withDisableManagedPricingWarningDialog(
          {
            universeId,
            count: selectedItems.length,
            onConfirm: () => performBulkUpdate(selectedItems, false),
          },
          { closeLabel: translate('Action.Close') },
        );
        return;
      }

      await performBulkUpdate(selectedItems, true);
    },
    [performBulkUpdate, selectionStore, translate, universeId],
  );

  const rows = useMemo(() => {
    if (showNoMatchingItemsEmptyState) {
      return <TableFilterEmptyState />;
    }

    return currentPage.map((product) => (
      <ManagedProductsTableRow
        key={getManagedProductId(product)}
        product={product}
        universeId={universeId}
      />
    ));
  }, [currentPage, showNoMatchingItemsEmptyState, universeId]);

  return (
    <TableSelectionProvider store={selectionStore}>
      <section>
        <ManagedProductsActionBar
          className='margin-bottom-medium'
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          disableSearch={!isAllProductsLoaded}
          typeFilter={typeFilter}
          statusFilter={statusFilter}
          onTypeFilterChange={setTypeFilter}
          onStatusFilterChange={setStatusFilter}
          disableFilter={!isAllProductsLoaded}
          onBulkAction={handleBulkAction}
          isBulkActionPending={isPending}
          isBulkActionDisabled={isPending}
        />

        <ManagedProductsTableBase
          sortColumn={sortColumn}
          sortOrder={sortOrder}
          disableSort={!isAllProductsLoaded}
          onSort={onSort}>
          {rows}
        </ManagedProductsTableBase>

        <ManagedProductsTableControls
          rowsPerPageOptions={rowsPerPageOptions}
          count={searchedProducts.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={onPageChange}
          onRowsPerPageChange={onRowsPerPageChange}
          className='padding-y-small'
        />
      </section>
    </TableSelectionProvider>
  );
}

export default memo(ManagedProductsTable);
