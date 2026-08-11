/* oxlint-disable react/react-compiler -- mutation callbacks require exhaustive dependencies; compiler flags those stable mutation refs as extra */
import { memo, useCallback, useMemo, useState } from 'react';
import type { GiftingTradingStatus } from '@rbx/client-developer-products-api/v1';
import { useTranslation } from '@rbx/intl';
import { withManagedPricingSubmitGuard } from '@modules/managed-pricing/dialogs/withManagedPricingSubmitGuard';
import type { ManagedPricingOnboardingStatus } from '@modules/managed-pricing/types';
import {
  openRequestErrorDialog,
  openPartialFailuresDialog,
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
import { useCurrentPage } from '@modules/monetization-shared/table-v1/useCurrentPage';
import { useTablePagination } from '@modules/monetization-shared/table-v1/useTablePagination';
import { useTokenizedSearch } from '@modules/monetization-shared/useTokenizedSearch';
import { useDeveloperProducts } from '../hooks/useDeveloperProducts';
import { BULK_UPDATE_LIMIT } from '../queries/constants';
import { useBatchUpdateDeveloperProductsManagedPricing } from '../queries/useBatchUpdateDeveloperProductsManagedPricing';
import type { DeveloperProductConfig } from '../types';
import { sortDeveloperProducts } from '../utils/sortDeveloperProducts';
import DeveloperProductsActionBarV2 from './DeveloperProductsActionBarV2';
import DeveloperProductsTableBase from './DeveloperProductsTableBase';
import DeveloperProductsTableRow from './DeveloperProductsTableRow';

const VALID_PAGE_SIZES = [10, 20, 50, 100] as const;
const ROWS_PER_PAGE_OPTIONS = [...VALID_PAGE_SIZES];
const INITIAL_ROWS_PER_PAGE = ROWS_PER_PAGE_OPTIONS[2]; // 50
const MAX_SELECTABLE_LIMIT = BULK_UPDATE_LIMIT;
const SEARCH_FIELDS = [
  'name',
  'productId',
] as const satisfies readonly (keyof DeveloperProductConfig)[];

type Props = {
  universeId: number;
  managedPricingOnboardingStatus?: ManagedPricingOnboardingStatus;
  giftingTradingStatus?: GiftingTradingStatus;
  initialRowsPerPage?: number;
  rowsPerPageOptions?: number[];
  selectionLimit?: number;
  perFetchPageSize?: number;
  /** Selects the archive-aware action bar layout and spacing. */
  isArchiveEnabled?: boolean;
  /** `undefined` when the archive flag is off; otherwise the resolved view. */
  showArchived?: boolean;
};

const getProductId = (product: DeveloperProductConfig) => product.productId;
const isProductSelectable = (product: DeveloperProductConfig): boolean | string =>
  product.isSelectableForManagedPricing || 'NotEligible';

function DeveloperProductsTableControls(
  props: Omit<TTableControlsProps, 'numSelected' | 'maxSelectable'>,
) {
  const { numSelected } = useSelectionStats();
  return <TableControls numSelected={numSelected} {...props} />;
}

function DeveloperProductsTable({
  universeId,
  managedPricingOnboardingStatus,
  giftingTradingStatus,
  initialRowsPerPage = INITIAL_ROWS_PER_PAGE,
  rowsPerPageOptions = ROWS_PER_PAGE_OPTIONS,
  selectionLimit = MAX_SELECTABLE_LIMIT,
  perFetchPageSize,
  isArchiveEnabled,
  showArchived,
}: Props) {
  const { translate } = useTranslation();

  const { developerProducts, hasNextPage, fetchNextPage } = useDeveloperProducts({
    universeId,
    pageSize: perFetchPageSize,
    isArchived: showArchived,
  });

  const isAllLoaded = !hasNextPage;

  const {
    searchQuery,
    setSearchQuery,
    results: searchedDeveloperProducts,
  } = useTokenizedSearch(developerProducts, SEARCH_FIELDS);

  const { sortedItems, sortColumn, sortOrder, onSort } = useSortItems(searchedDeveloperProducts, {
    sort: sortDeveloperProducts,
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
  });

  const [isBulkUpdatePending, setIsBulkUpdatePending] = useState<boolean>(false);

  const { mutateAsync: batchUpdateManagedPricing, isPending: isBatchUpdateManagedPricingPending } =
    useBatchUpdateDeveloperProductsManagedPricing(
      { universeId },
      {
        onPartialFailure: (errors, { productIds }) => {
          if (productIds.length > 1) {
            openPartialFailuresDialog({ count: errors.length });
          } else {
            openRequestErrorDialog();
          }
        },
        onError: () => openRequestErrorDialog(),
      },
    );

  const isAllModeAvailable = developerProducts.length <= selectionLimit && !hasNextPage;

  const selectionStore = useTableSelectionStoreInstance(
    { identifier: getProductId, selectable: isProductSelectable },
    {
      currentPage,
      items: searchedDeveloperProducts,
      mode: isAllModeAvailable ? 'all' : 'page',
      limit: selectionLimit,
      disabled: isBulkUpdatePending,
    },
  );

  const performBulkUpdateManagedPricing = useCallback(
    async (productIds: number[], enabled: boolean) => {
      setIsBulkUpdatePending(true);

      try {
        const { errors } = await batchUpdateManagedPricing(
          { productIds, enabled },
          { onSuccess: selectionStore.reset },
        );

        const successCount = productIds.length - (errors?.length ?? 0);
        if (successCount > 0) {
          const message = pluralize(
            successCount,
            translate('Message.SuccessfullyUpdatedSingleDeveloperProduct'),
            translate('Message.SuccessfullyUpdatedMultipleDeveloperProducts', {
              count: successCount.toString(),
            }),
          );
          toast({ title: message });
        }
      } finally {
        setIsBulkUpdatePending(false);
      }
    },
    [batchUpdateManagedPricing, selectionStore, translate],
  );

  const handleBulkToggleManagedPricing = useCallback(
    (action: Exclude<BulkToggleAction, 'none'>) => {
      const selectedProducts = selectionStore.getSelectedViewableItems();
      const productIds = selectedProducts.map(getProductId);

      /* istanbul ignore if -- guarding for completeness */
      if (selectedProducts.length === 0) {
        return;
      }

      if (productIds.length > selectionLimit) {
        openTooManyProductsToUpdateDialog();
        return;
      }

      const targetStatus = action === 'enabling';
      void withManagedPricingSubmitGuard({
        universeId,
        targetStatus,
        onboardingStatus: managedPricingOnboardingStatus,
        count: productIds.length,
        giftingTradingStatus,
        page: '/developer-products',
        onConfirm: () => performBulkUpdateManagedPricing(productIds, targetStatus),
      });
    },
    [
      giftingTradingStatus,
      managedPricingOnboardingStatus,
      performBulkUpdateManagedPricing,
      selectionLimit,
      selectionStore,
      universeId,
    ],
  );

  const rows = useMemo(
    () =>
      currentPage.map((product) => (
        <DeveloperProductsTableRow
          key={product.productId}
          universeId={universeId}
          showArchived={showArchived}
          {...product}
        />
      )),
    [currentPage, universeId, showArchived],
  );

  return (
    <TableSelectionProvider store={selectionStore}>
      <section>
        {showArchived && (
          <DeveloperProductsActionBarV2
            className='margin-bottom-medium'
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            disableSearch={!isAllLoaded}
            isArchiveEnabled={isArchiveEnabled}
            hideBulkAction
          />
        )}

        {!showArchived && (
          <DeveloperProductsActionBarV2
            // The chips row above supplies the gap once archiving is on.
            className='margin-bottom-medium'
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            disableSearch={!isAllLoaded}
            isArchiveEnabled={isArchiveEnabled}
            onBulkAction={handleBulkToggleManagedPricing}
            isBulkActionDisabled={isBatchUpdateManagedPricingPending}
            isBulkActionPending={isBulkUpdatePending}
          />
        )}

        <DeveloperProductsTableBase
          showArchived={showArchived}
          sortColumn={sortColumn}
          sortOrder={sortOrder}
          disableSort={!isAllLoaded}
          onSort={onSort}>
          {rows}
        </DeveloperProductsTableBase>

        <DeveloperProductsTableControls
          rowsPerPageOptions={rowsPerPageOptions}
          count={searchedDeveloperProducts.length}
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

export default memo(DeveloperProductsTable);
