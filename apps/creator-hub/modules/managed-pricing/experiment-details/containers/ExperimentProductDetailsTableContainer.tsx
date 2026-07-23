import { useRouter } from 'next/router';
import { useTranslation } from '@rbx/intl';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import { DEFAULT_PAGE_SIZE } from '../../queries/constants';
import type { ManagedPricingEvent } from '../../types';
import ExperimentProductsTable from '../components/ExperimentProductsTable';
import ExperimentProductsTableSkeleton from '../components/ExperimentProductsTableSkeleton';
import { useExperimentProducts } from '../hooks/useExperimentProducts';
import { useLoadInitialExperimentProductDetails } from '../hooks/useLoadInitialExperimentProductDetails';

type Props = {
  universeId: number;
  experimentId: string;
  /** All non-upcoming statuses are valid; the page-level dispatch narrows this down. */
  status: Exclude<ManagedPricingEvent['status'], 'Upcoming'>;
  perFetchPageSize?: number;
};

/**
 * Renders the product details table for non-upcoming experiments (Active, Completed, Cancelled,
 * Failed). Sourced from the experiment-product-details API rather than live managed-products.
 */
function ExperimentProductDetailsTableContainer({
  universeId,
  experimentId,
  status,
  perFetchPageSize = DEFAULT_PAGE_SIZE,
}: Props) {
  const router = useRouter();
  const { translate } = useTranslation();

  const { isInitialLoading, isInitialError } = useLoadInitialExperimentProductDetails({
    universeId,
    experimentId,
    pageSize: perFetchPageSize,
  });

  const experimentProducts = useExperimentProducts({
    universeId,
    experimentId,
    pageSize: perFetchPageSize,
  });

  if (isInitialLoading) {
    return <ExperimentProductsTableSkeleton showOptimization={status === 'Completed'} />;
  }

  if (isInitialError) {
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
      status={status}
      perFetchPageSize={perFetchPageSize}
      {...experimentProducts}
    />
  );
}

export default ExperimentProductDetailsTableContainer;
