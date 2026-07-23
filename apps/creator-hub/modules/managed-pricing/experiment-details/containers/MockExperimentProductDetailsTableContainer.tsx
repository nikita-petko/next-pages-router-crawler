import { useRouter } from 'next/router';
import { useTranslation } from '@rbx/intl';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import { useLoadInitialManagedProducts } from '../../manage-items/hooks/useLoadInitialManagedProducts';
import { DEFAULT_PAGE_SIZE } from '../../queries/constants';
import type { ManagedPricingEvent } from '../../types';
import ExperimentProductsTable from '../components/ExperimentProductsTable';
import ExperimentProductsTableSkeleton from '../components/ExperimentProductsTableSkeleton';
import { useMockExperimentProductDetails } from '../hooks/useMockExperimentProductDetails';

type Props = {
  universeId: number;
  experimentId: string;
  /** All non-upcoming statuses are valid; the page-level dispatch narrows this down. */
  status: Exclude<ManagedPricingEvent['status'], 'Upcoming'>;
  perFetchPageSize?: number;
};

/**
 * Renders the product details table for mock experiments.
 *
 * Uses the same schema for Upcoming experiments, but uses mocked local data for recommendations.
 */
function MockExperimentProductDetailsTableContainer({
  universeId,
  experimentId,
  status,
  perFetchPageSize = DEFAULT_PAGE_SIZE,
}: Props) {
  const router = useRouter();
  const { translate } = useTranslation();

  const { isLoading, isError } = useLoadInitialManagedProducts({
    universeId,
    pageSize: perFetchPageSize,
  });

  const experimentProducts = useMockExperimentProductDetails({
    universeId,
    experimentId,
    status,
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
      status={status}
      perFetchPageSize={perFetchPageSize}
      {...experimentProducts}
    />
  );
}

export default MockExperimentProductDetailsTableContainer;
