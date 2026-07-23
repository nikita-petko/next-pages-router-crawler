import { useRouter } from 'next/router';
import { useTranslation } from '@rbx/intl';
import EmptyState from '@modules/miscellaneous/components/EmptyState/EmptyState';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import HardCodedPricesTable from '../components/HardCodedPricesTable';
import HardCodedPricesTableSkeleton from '../components/HardCodedPricesTableSkeleton';
import { useListAllHardCodedPrices } from '../queries/useListAllHardCodedPrices';

type Props = {
  universeId: number;
  scanJobId: string;
  rootPlaceId: number;
};

function HardCodedPricesTableContainer({ universeId, scanJobId, rootPlaceId }: Props) {
  const { translate } = useTranslation();
  const router = useRouter();

  const {
    data: instances = [],
    isLoading,
    isError,
  } = useListAllHardCodedPrices({ universeId, scanJobId });

  if (isLoading) {
    return <HardCodedPricesTableSkeleton />;
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

  if (instances.length === 0) {
    return (
      <EmptyState
        title={translate('Heading.HardCodedPrices')}
        description={translate('Description.HardCodedPricesEmptyState')}
        size='small'
        illustration='chart'
      />
    );
  }

  return (
    <HardCodedPricesTable universeId={universeId} rootPlaceId={rootPlaceId} instances={instances} />
  );
}

export default HardCodedPricesTableContainer;
