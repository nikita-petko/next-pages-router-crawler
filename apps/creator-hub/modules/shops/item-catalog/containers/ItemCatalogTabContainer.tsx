import { memo } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from '@rbx/intl';
import EmptyState from '@modules/miscellaneous/components/EmptyState/EmptyState';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import { API_DEFAULT_PAGE_SIZE } from '../../queries/constants';
import { useGetCreatorShopConfig } from '../../queries/useGetCreatorShopConfig';
import ShopItemsTable from '../components/ShopItemsTable';
import ShopItemsTableSkeleton from '../components/ShopItemsTableSkeleton';
import { useLoadInitialShopItems } from '../hooks/useLoadInitialShopItems';

type Props = {
  universeId: number;
  shopId: number;
  perFetchPageSize?: number;
};

function ItemCatalogTabContainer({
  universeId,
  shopId,
  perFetchPageSize = API_DEFAULT_PAGE_SIZE,
}: Props) {
  const router = useRouter();
  const { translate } = useTranslation();

  const { isEmpty, isInitialLoading, isInitialError } = useLoadInitialShopItems({
    shopId,
    pageSize: perFetchPageSize,
  });

  // Categories come from the creator shop config; a hard failure here is treated
  // as a page-level error so the catalog never renders with a misleadingly empty
  // category list. Loading stays scoped to the table's category affordances.
  const { isError: isShopConfigError } = useGetCreatorShopConfig(shopId);

  if (isInitialError || isShopConfigError) {
    return (
      <FailureView
        title={translate('Heading.FailedToLoadPage')}
        message={translate('Message.FailedToLoadPage')}
        buttonText={translate('Action.FailedToLoadPage')}
        onReload={router.reload}
      />
    );
  }

  if (isInitialLoading) {
    return <ShopItemsTableSkeleton />;
  }

  if (isEmpty) {
    return (
      <EmptyState
        title={translate('Heading.ItemCatalog')}
        description={translate('Message.NoItemsFound')}
        size='small'
        illustration='chart'
      />
    );
  }

  return (
    <ShopItemsTable universeId={universeId} shopId={shopId} perFetchPageSize={perFetchPageSize} />
  );
}

export default memo(ItemCatalogTabContainer);
