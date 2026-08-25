import { useCallback, useMemo } from 'react';
import type { GiftingTradingStatus } from '@rbx/client-developer-products-api/v1';
import { Button } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import {
  openPartialFailuresDialog,
  openRequestErrorDialog,
} from '@modules/monetization-shared/error-dialogs';
import { ProgressCircleLoader } from '@modules/monetization-shared/loaders';
import { pluralize } from '@modules/monetization-shared/pluralize';
import { toast } from '@modules/monetization-shared/snackbar/actions';
import {
  TableSelectionProvider,
  useTableSelectionStoreInstance,
} from '@modules/monetization-shared/table-selection/context';
import { openGiftingTradingAcknowledgementDialogV2 } from '../../dialogs/GiftingTradingAcknowledgementDialogV2';
import { requiresGiftingTradingAcknowledgement } from '../../gifting-trading/utils';
import ManagedProductsTableBase from '../../manage-items/components/ManagedProductsTableBase';
import ManagedProductsTableRow from '../../manage-items/components/ManagedProductsTableRow';
import { useBatchUpdateManagedProductsStatus } from '../../manage-items/hooks/useBatchUpdateManagedProductsStatus';
import type { ManagedProduct } from '../../types';
import { useTopManagedProducts } from '../hooks/useTopManagedProducts';

const DISPLAYED_TOP_PRODUCTS_LIMIT = 5;

const QUERIED_TOP_PRODUCTS_LIMIT = 100;

const getManagedProductId = (product: ManagedProduct) => `${product.type}-${product.id}`;

type Props = {
  universeId: number;
  giftingTradingStatus?: GiftingTradingStatus;
  /** The number of top products to display in the table */
  displayLimit?: number;
  /** The number of top products to query from the API before filtering for products which are not already enrolled in managed pricing */
  queryLimit?: number;
};

function TopProductsTable({
  universeId,
  giftingTradingStatus,
  displayLimit = DISPLAYED_TOP_PRODUCTS_LIMIT,
  queryLimit = QUERIED_TOP_PRODUCTS_LIMIT,
}: Props) {
  const { translate } = useTranslation();

  const {
    data: topProducts,
    isLoading,
    isError,
  } = useTopManagedProducts({ universeId, limit: queryLimit });

  const filteredTopProducts = useMemo(() => {
    // We want to filter for products which are not already enrolled in managed pricing
    return topProducts.filter((product) => !product.isManagedPricingEnabled).slice(0, displayLimit);
  }, [topProducts, displayLimit]);

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

  const selectionStore = useTableSelectionStoreInstance(
    { identifier: getManagedProductId },
    {
      currentPage: filteredTopProducts,
      items: filteredTopProducts,
      mode: 'all',
      limit: displayLimit,
      disabled: isPending,
    },
  );

  const performBulkEnable = useCallback(
    async (selectedItems: ManagedProduct[]) => {
      // Errors are handled by mutation hook
      const result = await updateManagedProductsStatus({
        items: selectedItems,
        enabled: true,
      }).catch(() => undefined);
      if (!result) {
        return;
      }

      const successCount = selectedItems.length - result.errors.length;
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

  const handleBulkAction = useCallback(async () => {
    const selectedItems = selectionStore.getSelectedViewableItems();
    /* istanbul ignore if -- guarding for completeness */
    if (selectedItems.length === 0) {
      return;
    }

    const includesDeveloperProduct = selectedItems.some(
      (product) => product.type === 'DeveloperProduct',
    );

    if (includesDeveloperProduct && requiresGiftingTradingAcknowledgement(giftingTradingStatus)) {
      openGiftingTradingAcknowledgementDialogV2({
        universeId,
        page: '/managed-pricing/overview',
        onConfirm: () => performBulkEnable(selectedItems),
      });
      return;
    }

    await performBulkEnable(selectedItems);
  }, [giftingTradingStatus, performBulkEnable, selectionStore, universeId]);

  // Don't load skeleton as this may not exist
  if (isLoading) {
    return <ProgressCircleLoader />;
  }

  // Non-critical card - don't need to display on error or empty
  if (isError || filteredTopProducts.length === 0) {
    return null;
  }

  return (
    <div className='flex flex-col gap-small padding-xxlarge stroke-standard stroke-muted radius-medium'>
      <div className='flex flex-col gap-medium medium:flex-row medium:justify-between medium:items-center'>
        <div className='flex flex-col gap-small'>
          <span className='text-heading-small'>
            {translate('Heading.TopProductsTable' /* TranslationNamespace.ManagedPricing */)}
          </span>
          <span className='text-body-small'>
            {translate('Description.TopProductsTable' /* TranslationNamespace.ManagedPricing */)}
          </span>
        </div>
        <Button
          variant='Standard'
          size='Medium'
          onClick={handleBulkAction}
          isLoading={isPending}
          isDisabled={isPending}>
          {translate('Action.AddToManagedPricing' /* TranslationNamespace.ManagedPricing */)}
        </Button>
      </div>

      <TableSelectionProvider store={selectionStore}>
        <ManagedProductsTableBase borderless disableSort showRevenue>
          {filteredTopProducts.map((product) => (
            <ManagedProductsTableRow
              key={getManagedProductId(product)}
              product={product}
              universeId={universeId}
              showRevenue
            />
          ))}
        </ManagedProductsTableBase>
      </TableSelectionProvider>
    </div>
  );
}

export default TopProductsTable;
