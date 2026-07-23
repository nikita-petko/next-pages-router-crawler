/* istanbul ignore file */
import { useRouter } from 'next/router';
import { Button } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { FailureView } from '@modules/miscellaneous/common/components/FailureView';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { EmptyState } from '@modules/miscellaneous/common/components';
import useQueryParams from '@modules/miscellaneous/hooks/useQueryParams';
import { useLoadInitialManagedProducts } from '../manage-items/hooks/useLoadInitialManagedProducts';
import ManagedProductsTable from '../manage-items/components/ManagedProductsTable';
import ManagedProductsTableSkeleton from '../manage-items/components/ManagedProductsTableSkeleton';
import { DEFAULT_PAGE_LIMIT } from '../manage-items/hooks/constants';

type Props = {
  universeId: number;
  perPageFetchLimit?: number;
};

function ManageItemsTabContainer({ universeId, perPageFetchLimit = DEFAULT_PAGE_LIMIT }: Props) {
  const router = useRouter();
  const { translate } = useTranslation();

  const { isEmpty, isLoading, isError } = useLoadInitialManagedProducts({
    universeId,
    limit: perPageFetchLimit,
  });

  const [queryParams, setQueryParams] = useQueryParams(['empty']);
  const showEmptyState = !!queryParams.empty || isEmpty;

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

  if (showEmptyState) {
    return (
      <EmptyState
        title={translate('Heading.ManageItems')}
        description={translate('Description.ManageItemsEmptyState')}
        size='small'
        illustration='chart'>
        {!!queryParams.empty && (
          <Button
            variant='Emphasis'
            color='primary'
            onClick={() => setQueryParams({ empty: undefined })}>
            (Demo) Show products
          </Button>
        )}
      </EmptyState>
    );
  }

  return <ManagedProductsTable universeId={universeId} />;
}

export default withTranslation(ManageItemsTabContainer, [
  TranslationNamespace.Error,
  TranslationNamespace.Creations,
  TranslationNamespace.Table,
  TranslationNamespace.ManagedPricing,
]);
