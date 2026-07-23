import { useCallback, useMemo } from 'react';
import { Button, ProgressCircle } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import {
  TableSelectionProvider,
  useTableSelectionStoreInstance,
} from '@modules/monetization-shared/table-selection/context';
import { pluralize } from '@modules/monetization-shared/pluralize';
import { toast } from '@modules/monetization-shared/snackbar/actions';
import type { ManagedProduct } from '../../manage-items/types';
import ManagedProductsTableRow from '../../manage-items/components/ManagedProductsTableRow';
import ManagedProductsTableBase from '../../manage-items/components/ManagedProductsTableBase';
import { useBatchUpdateManagedProductsStatus } from '../../manage-items/hooks/useBatchUpdateManagedProductsStatus';
import useTopManagedProducts from '../hooks/useTopManagedProducts';

const DISPLAYED_TOP_PRODUCTS_LIMIT = 5;

const QUERIED_TOP_PRODUCTS_LIMIT = 100;

const getManagedProductId = (product: ManagedProduct) => `${product.type}-${product.id}`;

type Props = {
  universeId: number;
  /** The number of top products to display in the table */
  displayLimit?: number;
  /** The number of top products to query from the API before filtering for products which are not already enrolled in managed pricing */
  queryLimit?: number;
};

function TopProductsTable({
  universeId,
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
    useBatchUpdateManagedProductsStatus({ universeId });

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

  const handleBulkAction = useCallback(async () => {
    const selectedItems = selectionStore.getSelectedViewableItems();
    // Shouldn't happen, but guarding for completeness
    if (selectedItems.length === 0) {
      return;
    }

    const result = await updateManagedProductsStatus({ items: selectedItems, enabled: true });
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
  }, [selectionStore, translate, updateManagedProductsStatus]);

  if (isLoading) {
    return (
      <div className='flex justify-center items-center height-[320px]'>
        <ProgressCircle
          ariaLabel={translate('Label.Loading')}
          size='Large'
          variant='Indeterminate'
        />
      </div>
    );
  }

  // Non-critical card - don't need to display on error or empty
  if (isError || topProducts.length === 0) {
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
          {translate('Action.EnableManagedPricing' /* TranslationNamespace.Creations */)}
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
