import { useRouter } from 'next/router';
import { useTranslation } from '@rbx/intl';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import { useLoadInitialManagedProducts } from '../../manage-items/hooks/useLoadInitialManagedProducts';
import { DEFAULT_PAGE_SIZE } from '../../queries/constants';
import ExperimentProductsTable from '../components/ExperimentProductsTable';
import ExperimentProductsTableSkeleton from '../components/ExperimentProductsTableSkeleton';
import { useUpcomingExperimentProducts } from '../hooks/useUpcomingExperimentProducts';

type Props = {
  universeId: number;
  perFetchPageSize?: number;
};

/**
 * Renders the product details table for upcoming experiments.
 *
 * Upcoming experiments have not produced any experiment-product-details data yet, so the table is
 * sourced from the live managed-products list (filtered to managed-pricing-enabled products).
 */
function UpcomingProductDetailsTableContainer({
  universeId,
  perFetchPageSize = DEFAULT_PAGE_SIZE,
}: Props) {
  const router = useRouter();
  const { translate } = useTranslation();

  const { isLoading, isError } = useLoadInitialManagedProducts({
    universeId,
    pageSize: perFetchPageSize,
  });

  const experimentProducts = useUpcomingExperimentProducts({
    universeId,
    pageSize: perFetchPageSize,
  });

  if (isLoading) {
    return <ExperimentProductsTableSkeleton showOptimization={false} />;
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

  return (
    <ExperimentProductsTable
      universeId={universeId}
      status='Upcoming'
      perFetchPageSize={perFetchPageSize}
      {...experimentProducts}
    />
  );
}

export default UpcomingProductDetailsTableContainer;
