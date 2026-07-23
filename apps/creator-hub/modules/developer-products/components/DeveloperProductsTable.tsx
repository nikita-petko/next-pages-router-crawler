import { memo, useCallback, useMemo, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import { Button, useSnackbar } from '@rbx/ui';
import BulkDisableRegionalPricingDialog from '@modules/regional-pricing/dialogs/BulkDisableRegionalPricingDialog';
import BulkEnableRegionalPricingDialog from '@modules/regional-pricing/dialogs/BulkEnableRegionalPricingDialog';
import DeveloperProductRegionalPricingDisclaimerModal, {
  useDeveloperProductRegionalPricingDisclaimer,
} from '@modules/regional-pricing/components/DeveloperProductRegionalPricingDisclaimerModal/DeveloperProductRegionalPricingDisclaimerModal';
import {
  GeneralErrorDialog,
  PartialFailuresDialog,
  TooManyProductsToUpdateDialog,
  useErrorDialog,
} from '@modules/regional-pricing/dialogs/UpdateErrorDialogs';
import { useDeveloperProductsRegionalPricingPromotionBanner } from '@modules/regional-pricing/hooks/useRegionalPricingPromotionBanner';
import TableControls from '@modules/monetization-shared/table-v1/TableControls';
import { useTablePagination } from '@modules/monetization-shared/table-v1/useTablePagination';
import { useCurrentPage } from '@modules/monetization-shared/table-v1/useCurrentPage';
import { useSimpleDialog } from '@modules/monetization-shared/useSimpleDialog';
import { useSortItems } from '@modules/monetization-shared/table-sort/useSortItems';
import { sortDeveloperProducts } from '../utils/sortDeveloperProducts';
import { useDeveloperProducts } from '../hooks/useDeveloperProducts';
import { useSelectEligibleDeveloperProducts } from '../hooks/useSelectEligibleDeveloperProducts';
import { BULK_UPDATE_LIMIT } from '../queries/constants';
import { useBulkUpdateRegionalPricingForDeveloperProducts } from '../queries/useBulkUpdateRegionalPricingForDeveloperProducts';
import { DeveloperProductsSelectionProvider } from '../contexts/DeveloperProductsSelectionContext';
import CreateDeveloperProductButton from './common/CreateDeveloperProductButton';
import DeveloperProductsTableBase from './DeveloperProductsTableBase';
import DeveloperProductsTableRow from './DeveloperProductsTableRow';

type Props = {
  universeId: number;
  showPriceOptimization?: boolean;
  initialRowsPerPage?: number;
  rowsPerPageOptions?: number[];
  selectionLimit?: number;
  perPageFetchLimit?: number;
};

const VALID_PAGE_SIZES = [10, 20, 50, 100] as const;
const ROWS_PER_PAGE_OPTIONS = [...VALID_PAGE_SIZES];
const INITIAL_ROWS_PER_PAGE = ROWS_PER_PAGE_OPTIONS[2]; // 50
const MAX_SELECTABLE_LIMIT = BULK_UPDATE_LIMIT;

function pluralize(count: number, singular: string, plural: string) {
  return count === 1 ? singular : plural;
}

function DeveloperProductsTable({
  universeId,
  showPriceOptimization = false,
  initialRowsPerPage = INITIAL_ROWS_PER_PAGE,
  rowsPerPageOptions = ROWS_PER_PAGE_OPTIONS,
  selectionLimit = MAX_SELECTABLE_LIMIT,
  perPageFetchLimit,
}: Props) {
  const { translate } = useTranslation();

  const { developerProducts, hasNextPage, fetchNextPage } = useDeveloperProducts({
    universeId,
    limit: perPageFetchLimit,
  });

  const { sortedItems, sortColumn, sortOrder, onSort } = useSortItems(developerProducts, {
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

  const { close: closeRegionalPricingPromoBanner } =
    useDeveloperProductsRegionalPricingPromotionBanner(universeId);

  const { withDisclaimer: withRegionalPricingDisclaimer } =
    useDeveloperProductRegionalPricingDisclaimer(universeId);

  const { openErrorDialog, closeErrorDialog } = useErrorDialog();

  const bulkEnableRegionalPricingDialog = useSimpleDialog();
  const bulkDisableRegionalPricingDialog = useSimpleDialog();

  const [isBulkUpdatePending, setIsBulkUpdatePending] = useState<boolean>(false);

  const { enqueue } = useSnackbar();
  const toast = useCallback(
    (message: string) => enqueue({ message, autoHide: true }, (reason) => reason === 'timeout'),
    [enqueue],
  );

  const { mutateAsync, isPending } = useBulkUpdateRegionalPricingForDeveloperProducts(
    { universeId },
    {
      onSettled: () => {
        bulkDisableRegionalPricingDialog.close();
        bulkEnableRegionalPricingDialog.close();
      },
      onPartialFailure: (errors, { productIds }) =>
        openErrorDialog(
          // Treat partial update errors for a single product as general errors
          productIds.length > 1 ? (
            <PartialFailuresDialog count={errors.length} onClose={closeErrorDialog} />
          ) : (
            <GeneralErrorDialog onClose={closeErrorDialog} />
          ),
          { fullWidth: true },
        ),
      onError: () =>
        openErrorDialog(<GeneralErrorDialog onClose={closeErrorDialog} />, { fullWidth: true }),
    },
  );

  const selection = useSelectEligibleDeveloperProducts({
    currentPage,
    allProducts: developerProducts,
    mode: developerProducts.length <= selectionLimit && !hasNextPage ? 'all' : 'page',
    limit: selectionLimit,
    disabled: isBulkUpdatePending,
  });

  const handleSingleToggleRegionalPricing = useCallback(
    async (productId: number, enabled: boolean) => {
      await withRegionalPricingDisclaimer(
        () =>
          mutateAsync(
            { productIds: [productId], enabled },
            {
              onSuccess: ({ errors }) => {
                if (!errors.length) {
                  toast(translate('Message.SuccessfullyUpdatedDeveloperProduct'));
                }
              },
            },
          ).catch(() => {}),
        { enabled },
      );
    },
    [withRegionalPricingDisclaimer, mutateAsync, toast, translate],
  );

  const handleBulkToggleRegionalPricing = useCallback(
    async (enabled: boolean) => {
      // Note: we won't filter out products that are already in the desired state as they may be stale
      const productIds = Array.from(selection.selectedProducts.keys());
      if (productIds.length === 0) {
        return;
      }

      // Note: this should also ordinarily not happen, but we handle it just in case
      if (productIds.length > selectionLimit) {
        openErrorDialog(<TooManyProductsToUpdateDialog onClose={closeErrorDialog} />, {
          fullWidth: true,
        });
        return;
      }

      setIsBulkUpdatePending(true);

      // TODO(jeminpark,VEO-588): close promo banner when successfully enabling ALL products
      // Note errors are handled in the mutation hook
      try {
        const { errors } = await mutateAsync(
          { productIds, enabled },
          { onSuccess: selection.resetSelection },
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
          toast(message);
        }

        if (enabled && successCount === selection.numSelectable) {
          // If all products are being enabled, close the promo banner
          closeRegionalPricingPromoBanner();
        }
      } finally {
        setIsBulkUpdatePending(false);
      }
    },
    [
      selection.selectedProducts,
      selection.numSelectable,
      selection.resetSelection,
      selectionLimit,
      openErrorDialog,
      closeErrorDialog,
      translate,
      toast,
      mutateAsync,
      closeRegionalPricingPromoBanner,
    ],
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
    withRegionalPricingDisclaimer(bulkEnableRegionalPricingDialog.open);
  }, [withRegionalPricingDisclaimer, bulkEnableRegionalPricingDialog.open]);

  const rows = useMemo(
    () =>
      currentPage.map((product) => (
        <DeveloperProductsTableRow
          key={product.productId}
          universeId={universeId}
          showPriceOptimization={showPriceOptimization}
          onToggleRegionalPricing={handleSingleToggleRegionalPricing}
          disableToggleRegionalPricing={isBulkUpdatePending}
          {...product}
        />
      )),
    [
      currentPage,
      universeId,
      showPriceOptimization,
      handleSingleToggleRegionalPricing,
      isBulkUpdatePending,
    ],
  );

  const isAllLoaded = !hasNextPage;

  return (
    <DeveloperProductsSelectionProvider value={selection}>
      <section>
        <div className='flex justify-start items-center margin-top-[8px] gap-[10px]'>
          {selection.numSelected > 0 ? (
            <Button
              variant='contained'
              size='large'
              color='secondary'
              disabled={isPending}
              loading={isBulkUpdatePending}
              onClick={
                selection.isEnabling
                  ? handleClickRegionalPricingBulkEnable
                  : bulkDisableRegionalPricingDialog.open
              }>
              {selection.isEnabling
                ? translate('Action.EnableRegionalPricing')
                : translate('Action.DisableRegionalPricing')}
            </Button>
          ) : (
            <CreateDeveloperProductButton universeId={universeId} />
          )}
        </div>

        <TableControls
          numSelected={selection.numSelected}
          rowsPerPageOptions={rowsPerPageOptions}
          count={developerProducts.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={onPageChange}
          onRowsPerPageChange={onRowsPerPageChange}
          className='padding-y-small'
        />

        <DeveloperProductsTableBase
          showPriceOptimization={showPriceOptimization}
          sortColumn={sortColumn}
          sortOrder={sortOrder}
          disableSort={!isAllLoaded}
          onSort={onSort}>
          {rows}
        </DeveloperProductsTableBase>

        <TableControls
          numSelected={selection.numSelected}
          rowsPerPageOptions={rowsPerPageOptions}
          count={developerProducts.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={onPageChange}
          onRowsPerPageChange={onRowsPerPageChange}
          className='padding-y-small'
        />
      </section>

      <DeveloperProductRegionalPricingDisclaimerModal
        universeId={universeId}
        page='/developer-products'
      />

      <BulkEnableRegionalPricingDialog
        isOpen={bulkEnableRegionalPricingDialog.isOpen}
        onClose={bulkEnableRegionalPricingDialog.close}
        onConfirm={handleBulkEnableRegionalPricing}
        disabled={isPending}
        loading={isBulkUpdatePending}>
        {pluralize(
          selection.numSelected,
          translate('Message.EnableSingleProductForRegionalPricing'),
          translate('Message.EnableMultipleProductsForRegionalPricing', {
            count: selection.numSelected.toString(),
          }),
        )}
      </BulkEnableRegionalPricingDialog>

      <BulkDisableRegionalPricingDialog
        isOpen={bulkDisableRegionalPricingDialog.isOpen}
        onClose={bulkDisableRegionalPricingDialog.close}
        onConfirm={handleBulkDisableRegionalPricing}
        disabled={isPending}
        loading={isBulkUpdatePending}
      />
    </DeveloperProductsSelectionProvider>
  );
}

export default memo(DeveloperProductsTable);
