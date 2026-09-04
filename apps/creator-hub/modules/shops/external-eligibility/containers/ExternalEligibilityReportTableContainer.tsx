import { useRouter } from 'next/router';
import { useTranslation } from '@rbx/intl';
import EmptyState from '@modules/miscellaneous/components/EmptyState/EmptyState';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import { ProgressCircleLoader } from '@modules/monetization-shared/loaders';
import { useExternallyIneligibleShopItems } from '../../hooks/useExternallyIneligibleShopItems';
import ExternalEligibilityReportTable from '../components/ExternalEligibilityReportTable';

type Props = {
  universeId: number;
};

function ExternalEligibilityReportTableContainer({ universeId }: Props) {
  const router = useRouter();
  const { translate } = useTranslation();
  const { items, isLoading, isError } = useExternallyIneligibleShopItems(universeId);

  if (isLoading) {
    return <ProgressCircleLoader />;
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

  if (items.length === 0) {
    return (
      <EmptyState
        title={translate('Heading.ExternalEligibilityReport')}
        description={translate('Label.NoIneligibleItemsFound')}
        size='small'
        illustration='chart'
      />
    );
  }

  return <ExternalEligibilityReportTable items={items} />;
}

export default ExternalEligibilityReportTableContainer;
