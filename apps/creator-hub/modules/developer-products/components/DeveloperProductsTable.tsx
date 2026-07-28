/* oxlint-disable react/react-compiler -- mutation callbacks require exhaustive dependencies; compiler flags those stable mutation refs as extra */
import { memo, useCallback, useMemo, useState } from 'react';
import type { GiftingTradingStatus } from '@rbx/client-developer-products-api/v1';
import { useTranslation } from '@rbx/intl';
import { withManagedPricingSubmitGuard } from '@modules/managed-pricing/dialogs/withManagedPricingSubmitGuard';
import { isManagedPricingAvailable } from '@modules/managed-pricing/hooks/useIsManagedPricingAvailable';
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
import { useSimpleDialog } from '@modules/monetization-shared/useSimpleDialog';
import { useTokenizedSearch } from '@modules/monetization-shared/useTokenizedSearch';
import DeveloperProductRegionalPricingDisclaimerModal, {
  useDeveloperProductRegionalPricingDisclaimer,
} from '@modules/regional-pricing/components/DeveloperProductRegionalPricingDisclaimerModal/DeveloperProductRegionalPricingDisclaimerModal';
import BulkDisableRegionalPricingDialog from '@modules/regional-pricing/dialogs/BulkDisableRegionalPricingDialog';
import BulkEnableRegionalPricingDialog from '@modules/regional-pricing/dialogs/BulkEnableRegionalPricingDialog';
import { useDeveloperProducts } from '../hooks/useDeveloperProducts';
import { BULK_UPDATE_LIMIT } from '../queries/constants';
import { useBatchUpdateDeveloperProductsManagedPricing } from '../queries/useBatchUpdateDeveloperProductsManagedPricing';
import { useBulkUpdateRegionalPricingForDeveloperProducts } from '../queries/useBulkUpdateRegionalPricingForDeveloperProducts';
import type { DeveloperProductConfig } from '../types';
import { sortDeveloperProducts } from '../utils/sortDeveloperProducts';
import DeveloperProductsActionBar from './DeveloperProductsActionBar';
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
  showPriceOptimization?: boolean;
  managedPricingOnboardingStatus?: ManagedPricingOnboardingStatus;
  giftingTradingStatus?: GiftingTradingStatus;
  initialRowsPerPage?: number;
  rowsPerPageOptions?: number[];
  selectionLimit?: number;
  perFetchPageSize?: number;
  showArchived?: boolean;
};

const getProductId = (product: DeveloperProductConfig) => product.productId;
const isProductSelectable = (product: DeveloperProductConfig): boolean | string =>
  product.isSelectableForRegionalPricing || product.isSelectableForManagedPricing || 'NotEligible';

function DeveloperProductsTableControls(
  props: Omit<TTableControlsProps, 'numSelected' | 'maxSelectable'>,
) {
  const { numSelected } = useSelectionStats();
  return <TableControls numSelected={numSelected} {...props} />;
}

// TODO(jeminpark): this is a minor optimization to subscribe bulk dialogs to the selection store,
// should migrate to action-based dialog with foundation when we integrate managed pricing.
function BulkEnableDialogMessage() {
  const { translate } = useTranslation();
  const { numSelected } = useSelectionStats();

  return (
    <>
      {pluralize(
        numSelected,
        translate('Message.EnableSingleProductForRegionalPricing'),
        translate('Message.EnableMultipleProductsForRegionalPricing', {
          count: numSelected.toString(),
        }),
      )}
    </>
  );
}

function DeveloperProductsTable({
  universeId,
  showPriceOptimization = false,
  managedPricingOnboardingStatus,
  giftingTradingStatus,
  initialRowsPerPage = INITIAL_ROWS_PER_PAGE,
  rowsPerPageOptions = ROWS_PER_PAGE_OPTIONS,
  selectionLimit = MAX_SELECTABLE_LIMIT,
  perFetchPageSize,
  showArchived,
}: Props) {
  const { translate } = useTranslation();

  const { developerProducts, hasNextPage, fetchNextPage } = useDeveloperProducts({
    universeId,
    pageSize: perFetchPageSize,
    isArchived: showArchived,
  });

  const showManagedPricing = isManagedPricingAvailable(managedPricingOnboardingStatus);
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

  const { withDisclaimer: withRegionalPricingDisclaimer } =
    useDeveloperProductRegionalPricingDisclaimer(universeId);

  const bulkEnableRegionalPricingDialog = useSimpleDialog();
  const bulkDisableRegionalPricingDialog = useSimpleDialog();

  const [isBulkUpdatePending, setIsBulkUpdatePending] = useState<boolean>(false);

  const { mutateAsync: bulkUpdateRegionalPricing, isPending: isBulkUpdateRegionalPricingPending } =
    useBulkUpdateRegionalPricingForDeveloperProducts(
      { universeId },
      {
        onSettled: () => {
          bulkDisableRegionalPricingDialog.close();
          bulkEnableRegionalPricingDialog.close();
        },
        onPartialFailure: (errors, { productIds }) => {
          // Treat partial update errors for a single product as general errors
          if (productIds.length > 1) {
            openPartialFailuresDialog({ count: errors.length });
          } else {
            openRequestErrorDialog();
          }
        },
        onError: () => openRequestErrorDialog(),
      },
    );

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

  const handleSingleToggleRegionalPricing = useCallback(
    async (productId: number, enabled: boolean) => {
      await withRegionalPricingDisclaimer(
        () =>
          bulkUpdateRegionalPricing(
            { productIds: [productId], enabled },
            {
              onSuccess: ({ errors }) => {
                if (!errors.length) {
                  toast({ title: translate('Message.SuccessfullyUpdatedDeveloperProduct') });
                }
              },
            },
          ).catch(() => {}),
        { enabled },
      );
    },
    [withRegionalPricingDisclaimer, bulkUpdateRegionalPricing, translate],
  );

  const handleBulkToggleRegionalPricing = useCallback(
    async (enabled: boolean) => {
      // Note: we won't filter out products that are already in the desired state as they may be stale
      const selectedProducts = selectionStore.getSelectedViewableItems();
      const productIds = selectedProducts.map(getProductId);
      /* istanbul ignore if -- guarding for completeness */
      if (selectedProducts.length === 0) {
        return;
      }

      // Note: this should also ordinarily not happen, but we handle it just in case
      if (productIds.length > selectionLimit) {
        openTooManyProductsToUpdateDialog();
        return;
      }

      setIsBulkUpdatePending(true);

      try {
        const { errors } = await bulkUpdateRegionalPricing(
          { productIds, enabled },
          { onSuccess: selectionStore.reset },
        );

        const successCount = productIds.length - errors.length;
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
    [selectionStore, selectionLimit, translate, bulkUpdateRegionalPricing],
  );

  const handleBulkEnableRegionalPricing = useCallback(
    () => handleBulkToggleRegionalPricing(true),
    [handleBulkToggleRegionalPricing],
  );

  const handleBulkDisableRegionalPricing = useCallback(
    () => handleBulkToggleRegionalPricing(false),
    [handleBulkToggleRegionalPricing],
  );

  const handleClickRegionalPricingBulkEnable = useCallback(() => {
    void withRegionalPricingDisclaimer(bulkEnableRegionalPricingDialog.open);
  }, [withRegionalPricingDisclaimer, bulkEnableRegionalPricingDialog.open]);

  const handleBulkAction = useCallback(
    (action: Exclude<BulkToggleAction, 'none'>) => {
      const callback =
        action === 'enabling'
          ? handleClickRegionalPricingBulkEnable
          : bulkDisableRegionalPricingDialog.open;

      callback();
    },
    [handleClickRegionalPricingBulkEnable, bulkDisableRegionalPricingDialog.open],
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
          showManagedPricing={showManagedPricing}
          showPriceOptimization={showPriceOptimization}
          showArchived={showArchived}
          onToggleRegionalPricing={handleSingleToggleRegionalPricing}
          disableToggleRegionalPricing={isBulkUpdatePending}
          {...product}
        />
      )),
    [
      currentPage,
      universeId,
      showManagedPricing,
      showPriceOptimization,
      showArchived,
      handleSingleToggleRegionalPricing,
      isBulkUpdatePending,
    ],
  );

  return (
    <TableSelectionProvider store={selectionStore}>
      <section>
        {showArchived && (
          <DeveloperProductsActionBarV2
            className='margin-bottom-medium padding-top-small'
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            disableSearch={!isAllLoaded}
            hideBulkAction
          />
        )}

        {!showArchived && showManagedPricing && (
          <DeveloperProductsActionBarV2
            className='margin-bottom-medium padding-top-small'
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            disableSearch={!isAllLoaded}
            onBulkAction={handleBulkToggleManagedPricing}
            isBulkActionDisabled={isBatchUpdateManagedPricingPending}
            isBulkActionPending={isBulkUpdatePending}
          />
        )}

        {!showArchived && !showManagedPricing && (
          <DeveloperProductsActionBar
            className='margin-top-[8px]'
            universeId={universeId}
            onBulkAction={handleBulkAction}
            isBulkActionDisabled={isBulkUpdateRegionalPricingPending}
            isBulkActionPending={isBulkUpdatePending}
          />
        )}

        {!showManagedPricing && !showArchived && (
          <DeveloperProductsTableControls
            rowsPerPageOptions={rowsPerPageOptions}
            count={searchedDeveloperProducts.length}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={onPageChange}
            onRowsPerPageChange={onRowsPerPageChange}
            className='padding-y-small'
          />
        )}

        <DeveloperProductsTableBase
          showPriceOptimization={showPriceOptimization}
          showManagedPricing={showManagedPricing}
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

      {!showManagedPricing && !showArchived && (
        <DeveloperProductRegionalPricingDisclaimerModal
          universeId={universeId}
          page='/developer-products'
        />
      )}

      {!showManagedPricing && !showArchived && (
        <BulkEnableRegionalPricingDialog
          isOpen={bulkEnableRegionalPricingDialog.isOpen}
          onClose={bulkEnableRegionalPricingDialog.close}
          onConfirm={handleBulkEnableRegionalPricing}
          disabled={isBulkUpdateRegionalPricingPending}
          loading={isBulkUpdatePending}>
          <BulkEnableDialogMessage />
        </BulkEnableRegionalPricingDialog>
      )}

      {!showManagedPricing && !showArchived && (
        <BulkDisableRegionalPricingDialog
          isOpen={bulkDisableRegionalPricingDialog.isOpen}
          onClose={bulkDisableRegionalPricingDialog.close}
          onConfirm={handleBulkDisableRegionalPricing}
          disabled={isBulkUpdateRegionalPricingPending}
          loading={isBulkUpdatePending}
        />
      )}
    </TableSelectionProvider>
  );
}

export default memo(DeveloperProductsTable);
