import { memo, useCallback, useMemo } from 'react';
import type { GiftingTradingStatus } from '@rbx/client-developer-products-api/v1';
import { useTranslation } from '@rbx/intl';
import { BULK_UPDATE_LIMIT } from '@modules/developer-products/queries/constants';
import {
  openPartialFailuresDialog,
  openRequestErrorDialog,
  openTooManyProductsToUpdateDialog,
} from '@modules/monetization-shared/error-dialogs';
import { pluralize } from '@modules/monetization-shared/pluralize';
import { toast } from '@modules/monetization-shared/snackbar/actions';
import {
  TableSelectionProvider,
  useTableSelectionStoreInstance,
} from '@modules/monetization-shared/table-selection/context';
import {
  useSelectionStats,
  type BulkToggleAction,
} from '@modules/monetization-shared/table-selection/hooks';
import { useSortItems } from '@modules/monetization-shared/table-sort/useSortItems';
import TableControls from '@modules/monetization-shared/table-v1/TableControls';
import type { TTableControlsProps } from '@modules/monetization-shared/table-v1/TableControls';
import TableFilterEmptyState from '@modules/monetization-shared/table-v1/TableFilterEmptyState';
import { useCurrentPage } from '@modules/monetization-shared/table-v1/useCurrentPage';
import { useTablePagination } from '@modules/monetization-shared/table-v1/useTablePagination';
import { useTokenizedSearch } from '@modules/monetization-shared/useTokenizedSearch';
import { withDisableManagedPricingWarningDialog } from '../../dialogs/DisableManagedPricingWarningDialog';
import { openGiftingTradingAcknowledgementDialogV2 } from '../../dialogs/GiftingTradingAcknowledgementDialogV2';
import { requiresGiftingTradingAcknowledgement } from '../../gifting-trading/utils';
import { ITEM_IN_PRICE_TEST_REASON, type ManagedProduct } from '../../types';
import { useBatchUpdateManagedProductsStatus } from '../hooks/useBatchUpdateManagedProductsStatus';
import { useManagedProducts } from '../hooks/useManagedProducts';
import { useManagedProductsFilters } from '../hooks/useManagedProductsFilters';
import { sortManagedProducts } from '../utils/sortManagedProducts';
import ManagedProductsActionBar from './ManagedProductsActionBar';
import ManagedProductsTableBase from './ManagedProductsTableBase';
import ManagedProductsTableRow from './ManagedProductsTableRow';

const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100];
const INITIAL_ROWS_PER_PAGE = ROWS_PER_PAGE_OPTIONS[0]; // 10
const MAX_SELECTABLE_LIMIT = BULK_UPDATE_LIMIT;
const SEARCH_FIELDS = ['name', 'id'] as const satisfies readonly (keyof ManagedProduct)[];

type Props = {
  universeId: number;
  giftingTradingStatus?: GiftingTradingStatus;
  initialRowsPerPage?: number;
  rowsPerPageOptions?: number[];
  selectionLimit?: number;
  perFetchPageSize?: number;
};

const getManagedProductId = (product: ManagedProduct) => `${product.type}-${product.id}`;
const isManagedProductSelectable = (product: ManagedProduct): boolean | string =>
  !product.isInActivePriceOptimizationExperiment || ITEM_IN_PRICE_TEST_REASON;

function ManagedProductsTableControls(
  props: Omit<TTableControlsProps, 'numSelected' | 'maxSelectable'>,
) {
  const { numSelected } = useSelectionStats();

  return <TableControls numSelected={numSelected} {...props} />;
}

function ManagedProductsTable({
  universeId,
  giftingTradingStatus,
  initialRowsPerPage = INITIAL_ROWS_PER_PAGE,
  rowsPerPageOptions = ROWS_PER_PAGE_OPTIONS,
  selectionLimit = MAX_SELECTABLE_LIMIT,
  perFetchPageSize,
}: Props) {
  const { translate } = useTranslation();

  const {
    allProducts,
    developerProducts,
    gamePasses,
    isAllProductsLoaded,
    hasNextDevProductsPage,
    fetchNextDevProductsPage,
  } = useManagedProducts({ universeId, pageSize: perFetchPageSize });

  const { filters, setFilters, filteredProducts } = useManagedProductsFilters({
    products: allProducts,
    developerProducts,
    gamePasses,
  });

  const {
    searchQuery,
    setSearchQuery,
    results: searchedProducts,
  } = useTokenizedSearch(filteredProducts, SEARCH_FIELDS);

  const { sortColumn, sortOrder, onSort, sortedItems } = useSortItems(searchedProducts, {
    sort: sortManagedProducts,
  });

  const hasActiveSearchOrFilter =
    searchQuery.trim().length > 0 ||
    filters.typeFilter !== undefined ||
    filters.statusFilter !== undefined;

  const showNoMatchingItemsEmptyState =
    allProducts.length > 0 && searchedProducts.length === 0 && hasActiveSearchOrFilter;

  const { page, rowsPerPage, onPageChange, onRowsPerPageChange } = useTablePagination({
    count: sortedItems.length,
    initialRowsPerPage,
  });

  const { currentPage } = useCurrentPage(sortedItems, {
    page,
    rowsPerPage,
    hasNextPage: filters.typeFilter !== 'GamePass' && hasNextDevProductsPage,
    fetchNextPage: fetchNextDevProductsPage,
    fetchLimit: perFetchPageSize,
  });

  const { mutateAsync: updateManagedProductsStatus, isPending } =
    useBatchUpdateManagedProductsStatus(
      { universeId },
      {
        onPartialFailure: (errors, { items }) => {
          if (items.length > 1) {
            openPartialFailuresDialog({ count: errors.length });
          } else {
            openRequestErrorDialog();
          }
        },
        onError: () => openRequestErrorDialog(),
      },
    );

  // Note: selection store is a singleton stable reference
  const selectionStore = useTableSelectionStoreInstance(
    { identifier: getManagedProductId, selectable: isManagedProductSelectable },
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
      // Errors are handled by mutation hook
      const result = await updateManagedProductsStatus({ items, enabled }).catch(() => undefined);
      if (!result) {
        return;
      }

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
    async (action: Exclude<BulkToggleAction, 'none'>) => {
      const selectedItems = selectionStore.getSelectedViewableItems();
      /* istanbul ignore if -- guarding for completeness */
      if (selectedItems.length === 0) {
        return;
      }

      // Note: the selection store enforces this, but keep the guard in case of contractual upstream changes.
      /* istanbul ignore if -- guarding for completeness */
      if (selectedItems.length > selectionLimit) {
        openTooManyProductsToUpdateDialog();
        return;
      }

      if (action === 'disabling') {
        await withDisableManagedPricingWarningDialog({
          universeId,
          count: selectedItems.length,
          onConfirm: () => performBulkUpdate(selectedItems, false),
        });
        return;
      }

      const includesDeveloperProduct = selectedItems.some(
        (product) => product.type === 'DeveloperProduct',
      );

      if (includesDeveloperProduct && requiresGiftingTradingAcknowledgement(giftingTradingStatus)) {
        openGiftingTradingAcknowledgementDialogV2({
          universeId,
          page: '/managed-pricing/manage-items',
          onConfirm: () => performBulkUpdate(selectedItems, true),
        });
        return;
      }

      await performBulkUpdate(selectedItems, true);
    },
    [giftingTradingStatus, selectionLimit, performBulkUpdate, selectionStore, universeId],
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
          filters={filters}
          setFilters={setFilters}
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
