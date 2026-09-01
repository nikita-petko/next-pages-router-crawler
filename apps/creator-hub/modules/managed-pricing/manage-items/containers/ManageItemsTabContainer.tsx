import { useRouter } from 'next/router';
import type { GiftingTradingStatus } from '@rbx/client-developer-products-api/v1';
import { useTranslation, withTranslation } from '@rbx/intl';
import EmptyState from '@modules/miscellaneous/components/EmptyState/EmptyState';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { DEFAULT_PAGE_SIZE } from '../../queries/constants';
import ManagedProductsTable from '../components/ManagedProductsTable';
import ManagedProductsTableSkeleton from '../components/ManagedProductsTableSkeleton';
import { useLoadInitialManagedProducts } from '../hooks/useLoadInitialManagedProducts';

type Props = {
  universeId: number;
  giftingTradingStatus?: GiftingTradingStatus;
  perFetchPageSize?: number;
};

function ManageItemsTabContainer({
  universeId,
  giftingTradingStatus,
  perFetchPageSize = DEFAULT_PAGE_SIZE,
}: Props) {
  const router = useRouter();
  const { translate } = useTranslation();

  const { isEmpty, isLoading, isError } = useLoadInitialManagedProducts({
    universeId,
    pageSize: perFetchPageSize,
  });

  if (isLoading) {
    return <ManagedProductsTableSkeleton />;
  }

  if (isError) {
    return (
      <FailureView
        title={translate('Heading.FailedToLoadPage')}
        message={translate('Message.FailedToLoadPage')}
        buttonText={translate('Action.FailedToLoadPage')}
        onReload={router.reload}
      />
    );
  }

  if (isEmpty) {
    return (
      <EmptyState
        title={translate('Heading.ManageItems')}
        description={translate('Description.ManageItemsEmptyState')}
        size='small'
        illustration='chart'
      />
    );
  }

  return (
    <ManagedProductsTable
      universeId={universeId}
      giftingTradingStatus={giftingTradingStatus}
      perFetchPageSize={perFetchPageSize}
    />
  );
}

export default withTranslation(ManageItemsTabContainer, [
  TranslationNamespace.Error,
  TranslationNamespace.Creations,
  TranslationNamespace.Table,
  TranslationNamespace.ManagedPricing,
]);
