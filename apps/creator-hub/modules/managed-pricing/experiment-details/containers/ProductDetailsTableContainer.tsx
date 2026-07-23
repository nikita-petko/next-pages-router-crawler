/* istanbul ignore file */
import { useRouter } from 'next/router';
import { useTranslation } from '@rbx/intl';
import { FailureView } from '@modules/miscellaneous/common/components/FailureView';
import { useLoadInitialManagedProducts } from '../../manage-items/hooks/useLoadInitialManagedProducts';
import { DEFAULT_PAGE_LIMIT } from '../../manage-items/hooks/constants';
import ExperimentProductsTable from '../components/ExperimentProductsTable';
import ExperimentProductsTableSkeleton from '../components/ExperimentProductsTableSkeleton';

type Props = {
  universeId: number;
  status: 'upcoming' | 'completed';
  perPageFetchLimit?: number;
};

function ProductDetailsTableContainer({
  universeId,
  status,
  perPageFetchLimit = DEFAULT_PAGE_LIMIT,
}: Props) {
  const router = useRouter();
  const { translate } = useTranslation();

  // TODO: this is mocked - replace with actual query
  const { isLoading, isError } = useLoadInitialManagedProducts({
    universeId,
    limit: perPageFetchLimit,
  });

  if (isLoading) {
    return <ExperimentProductsTableSkeleton showOptimization={status === 'completed'} />;
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

  return <ExperimentProductsTable universeId={universeId} status={status} />;
}

export default ProductDetailsTableContainer;
