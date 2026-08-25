import { memo, useCallback, useMemo } from 'react';
import type { Category } from '@rbx/client-shops-api/v1';
import { useTranslation } from '@rbx/intl';
import { useDiscardChangesPrompt } from '@modules/monetization-shared/discard-dialog/useDiscardChangesPrompt';
import { toast } from '@modules/monetization-shared/snackbar/actions';
import {
  TableSelectionProvider,
  useTableSelectionStoreInstance,
} from '@modules/monetization-shared/table-selection/context';
import {
  useSelectionStats,
  type BulkActionHandler,
} from '@modules/monetization-shared/table-selection/hooks';
import { useSortItems } from '@modules/monetization-shared/table-sort/useSortItems';
import TableControls, {
  type TTableControlsProps,
} from '@modules/monetization-shared/table-v1/TableControls';
import TableFilterEmptyState from '@modules/monetization-shared/table-v1/TableFilterEmptyState';
import { useCurrentPage } from '@modules/monetization-shared/table-v1/useCurrentPage';
import { useTablePagination } from '@modules/monetization-shared/table-v1/useTablePagination';
import { useTokenizedSearch } from '@modules/monetization-shared/useTokenizedSearch';
import { BULK_SELECTION_LIMIT, DEFAULT_PAGE_SIZE, ROWS_PER_PAGE_OPTIONS } from '../../constants';
import { getPublishErrorMessageKey } from '../../queries/errors';
import { useBatchUpdateShopItems } from '../../queries/useBatchUpdateShopItems';
import { getShopItemKey, isVisibilityEditable, type ShopItem } from '../../types';
import { CategoryCountsProvider } from '../contexts/CategoryCountsContext';
import { openBulkEditCategoryDialog } from '../dialogs/BulkEditCategoryDialog';
import { openHideListingDialog } from '../dialogs/HideListingDialog';
import { openPublishErrorDialog } from '../dialogs/PublishErrorDialog';
import { openPublishShopDialog } from '../dialogs/PublishShopDialog';
import { useAvailableCategories } from '../hooks/useAvailableCategories';
import { usePendingShopItemEdits, type ShopItemInput } from '../hooks/usePendingShopItemEdits';
import { useShopItems } from '../hooks/useShopItems';
import { useShopItemsFilters } from '../hooks/useShopItemsFilters';
import { sortShopItems } from '../utils/sortShopItems';
import ShopItemsActionBar from './ShopItemsActionBar';
import ShopItemsTableBase from './ShopItemsTableBase';
import ShopItemsTableRow from './ShopItemsTableRow';

const SEARCH_FIELDS = ['name', 'id'] as const satisfies readonly (keyof ShopItem)[];

type Props = {
  universeId: number;
  shopId: number;
  /** Items per server fetch; sized so reaching the last UI page eagerly grabs a meaningful chunk. */
  perFetchPageSize?: number;
  initialRowsPerPage?: number;
  rowsPerPageOptions?: readonly number[];
  selectionLimit?: number;
};

function ShopItemsTableControls(props: Omit<TTableControlsProps, 'numSelected' | 'maxSelectable'>) {
  const { numSelected } = useSelectionStats<string, ShopItem>();
  return <TableControls numSelected={numSelected} {...props} />;
}

function showSuccessToast(title: string): void {
  toast({ title, icon: 'icon-regular-circle-check' });
}

function ShopItemsTable({
  universeId,
  shopId,
  perFetchPageSize,
  initialRowsPerPage = DEFAULT_PAGE_SIZE,
  rowsPerPageOptions = ROWS_PER_PAGE_OPTIONS,
  selectionLimit = BULK_SELECTION_LIMIT,
}: Props) {
  const {
    items: fetchedItems,
    hasNextPage,
    fetchNextPage,
    isAllItemsLoaded,
  } = useShopItems({
    shopId,
    pageSize: perFetchPageSize,
  });

  const { categories: baseCategories, isLoading: areCategoriesLoading } = useAvailableCategories({
    shopId,
  });
  const { translate } = useTranslation();

  const {
    draftItems: items,
    availableCategories,
    toggleVisibility,
    setBulkVisibility,
    setCategory,
    renameCategory,
    addCategory,
    categoryCountDeltas,
    hasPendingEdits,
    getPendingEdits,
    clear,
  } = usePendingShopItemEdits(fetchedItems, baseCategories);

  // Prompt before leaving (page nav, tab switch, or reload) with unsaved edits.
  useDiscardChangesPrompt(hasPendingEdits);

  // The mutation hook optimistically patches the items + categories cache before
  // forwarding onSuccess, `isPublishing` locks edit affordances. On error the
  // drafts are kept intact.
  const { mutate: publishChanges, isPending: isPublishing } = useBatchUpdateShopItems({
    onSuccess: () => {
      clear();
      showSuccessToast(translate('Message.PublishSuccessful'));
    },
    onError: async (error) => {
      const messageKey = await getPublishErrorMessageKey(error);
      openPublishErrorDialog({ messageKey });
    },
  });

  const availableCategoryNames = useMemo(
    () => availableCategories.map((category) => category.name),
    [availableCategories],
  );

  // Base counts: rebuilt only when items reload
  // Gated on `isAllItemsLoaded` so partial-page counts never leak into the UI
  const fetchedCategoryCounts = useMemo<ReadonlyMap<string, number> | null>(() => {
    if (!isAllItemsLoaded) {
      return null;
    }
    const counts = new Map<string, number>();
    for (const item of fetchedItems) {
      counts.set(item.category.id, (counts.get(item.category.id) ?? 0) + 1);
    }
    return counts;
  }, [isAllItemsLoaded, fetchedItems]);

  const categoryCounts = useMemo<ReadonlyMap<string, number> | undefined>(() => {
    if (!fetchedCategoryCounts) {
      return undefined;
    }
    const hasDraftCategories = availableCategories.length > fetchedCategoryCounts.size;
    if (categoryCountDeltas.size === 0 && !hasDraftCategories) {
      return fetchedCategoryCounts;
    }
    const merged = new Map(fetchedCategoryCounts);
    // Seed 0 for draft categories so they still render a badge once every
    // item that was moved into them has been moved back out.
    for (const category of availableCategories) {
      if (!merged.has(category.id)) {
        merged.set(category.id, 0);
      }
    }
    for (const [id, delta] of categoryCountDeltas) {
      merged.set(id, (merged.get(id) ?? 0) + delta);
    }
    return merged;
  }, [fetchedCategoryCounts, categoryCountDeltas, availableCategories]);

  const { filters, setFilters, filteredItems, hasActiveFilter } = useShopItemsFilters({ items });

  const {
    searchQuery,
    setSearchQuery,
    results: searchedItems,
  } = useTokenizedSearch(filteredItems, SEARCH_FIELDS);

  const { sortColumn, sortOrder, onSort, sortedItems } = useSortItems(searchedItems, {
    sort: sortShopItems,
  });

  const { page, rowsPerPage, onPageChange, onRowsPerPageChange } = useTablePagination({
    count: sortedItems.length,
    initialRowsPerPage,
  });

  const { currentPage } = useCurrentPage(sortedItems, {
    page,
    rowsPerPage,
    hasNextPage,
    fetchNextPage,
    fetchLimit: perFetchPageSize,
  });

  const hasActiveSearchOrFilter = searchQuery.trim().length > 0 || hasActiveFilter;

  const showNoMatchingItemsEmptyState =
    items.length > 0 && sortedItems.length === 0 && hasActiveSearchOrFilter;

  const selectionStore = useTableSelectionStoreInstance(
    { identifier: getShopItemKey },
    {
      currentPage,
      items: searchedItems,
      mode: searchedItems.length <= selectionLimit ? 'all' : 'page',
      limit: selectionLimit,
      disabled: isPublishing,
    },
  );

  const handleToggleVisibility = useCallback(
    (item: ShopItem) => {
      if (toggleVisibility(item)) {
        showSuccessToast(translate('Message.VisibilityUpdated'));
      }
    },
    [toggleVisibility, translate],
  );

  const handleSetBulkVisibility = useCallback(
    (itemsToEdit: ShopItem[], isVisibleInShop: boolean) => {
      if (setBulkVisibility(itemsToEdit, isVisibleInShop)) {
        showSuccessToast(translate('Message.VisibilityUpdated'));
      }
    },
    [setBulkVisibility, translate],
  );

  const handleSetCategory = useCallback(
    (itemsToEdit: ShopItemInput, nextCategory: Category) => {
      if (setCategory(itemsToEdit, nextCategory)) {
        showSuccessToast(translate('Message.CategoryUpdated'));
      }
    },
    [setCategory, translate],
  );

  const handleRenameCategory = useCallback(
    (categoryId: string, newName: string) => {
      if (renameCategory(categoryId, newName)) {
        showSuccessToast(translate('Message.CategoryRenamed'));
      }
    },
    [renameCategory, translate],
  );

  const handleAddCategory = useCallback(
    (itemsToEdit: ShopItemInput, name: string) => {
      addCategory(itemsToEdit, name);
      showSuccessToast(translate('Message.CategoryAdded'));
    },
    [addCategory, translate],
  );

  const handleBulkVisibility = useCallback<BulkActionHandler>(
    (action) => {
      const editable = selectionStore
        .getSelectedViewableItems()
        .filter((item) => isVisibilityEditable(item));
      if (editable.length === 0) {
        return;
      }
      // Unlisting is gated through a confirmation dialog; listing is direct.
      if (action === 'disabling') {
        openHideListingDialog({
          count: editable.length,
          onConfirm: () => {
            handleSetBulkVisibility(editable, false);
            selectionStore.reset();
          },
        });
        return;
      }
      handleSetBulkVisibility(editable, true);
      selectionStore.reset();
    },
    [selectionStore, handleSetBulkVisibility],
  );

  const handleBulkEditCategory = useCallback(() => {
    const selectedItems = selectionStore.getSelectedViewableItems();
    if (selectedItems.length === 0) {
      return;
    }

    openBulkEditCategoryDialog({
      availableCategories,
      onConfirm: (payload) => {
        if (payload.type === 'existing') {
          handleSetCategory(selectedItems, payload.category);
        } else {
          handleAddCategory(selectedItems, payload.name);
        }
        selectionStore.reset();
      },
    });
  }, [availableCategories, handleAddCategory, handleSetCategory, selectionStore]);

  const handlePublish = useCallback(() => {
    openPublishShopDialog({
      onConfirm: () => publishChanges({ shopId, ...getPendingEdits() }),
    });
  }, [publishChanges, shopId, getPendingEdits]);

  // Pre-build the row elements so unrelated parent re-renders don't re-create the array
  const rows = useMemo(
    () =>
      currentPage.map((item) => (
        <ShopItemsTableRow
          key={getShopItemKey(item)}
          item={item}
          universeId={universeId}
          availableCategories={availableCategories}
          onToggleVisibility={handleToggleVisibility}
          onChangeCategory={handleSetCategory}
          onRenameCategory={handleRenameCategory}
          onAddCategory={handleAddCategory}
          disabled={isPublishing || areCategoriesLoading}
        />
      )),
    [
      currentPage,
      universeId,
      availableCategories,
      handleToggleVisibility,
      handleSetCategory,
      handleRenameCategory,
      handleAddCategory,
      isPublishing,
      areCategoriesLoading,
    ],
  );

  return (
    <TableSelectionProvider store={selectionStore}>
      <section>
        <ShopItemsActionBar
          className='margin-bottom-medium'
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          disableSearch={!isAllItemsLoaded}
          filters={filters}
          setFilters={setFilters}
          categoryOptions={availableCategoryNames}
          disableFilter={!isAllItemsLoaded || areCategoriesLoading}
          onBulkVisibilityAction={handleBulkVisibility}
          onBulkEditCategory={handleBulkEditCategory}
          areCategoriesLoading={areCategoriesLoading}
          hasPendingEdits={hasPendingEdits}
          onPublish={handlePublish}
          isPublishing={isPublishing}
        />

        <ShopItemsTableBase
          sortColumn={sortColumn}
          sortOrder={sortOrder}
          disableSort={!isAllItemsLoaded}
          onSort={onSort}>
          {showNoMatchingItemsEmptyState || currentPage.length === 0 ? (
            <TableFilterEmptyState />
          ) : (
            // Counts flow via context so a category edit re-renders only the
            // dropdown subscribers — `memo()` on the row stays intact.
            <CategoryCountsProvider counts={categoryCounts}>{rows}</CategoryCountsProvider>
          )}
        </ShopItemsTableBase>

        <ShopItemsTableControls
          rowsPerPageOptions={[...rowsPerPageOptions]}
          count={sortedItems.length}
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

export default memo(ShopItemsTable);
