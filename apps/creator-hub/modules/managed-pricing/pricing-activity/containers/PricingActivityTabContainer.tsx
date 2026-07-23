/* istanbul ignore file */
import { useRouter } from 'next/router';
import { useTranslation, withTranslation } from '@rbx/intl';
import EmptyState from '@modules/miscellaneous/components/EmptyState/EmptyState';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { ProgressCircleLoader } from '@modules/monetization-shared/loaders';
import { useListAllManagedPricingEvents } from '../../queries/useListAllManagedPricingEvents';
import ManagedPricingEventsTable from '../components/ManagedPricingEventsTable';

function PricingActivityTabContainer({ universeId }: { universeId: number }) {
  const { translate } = useTranslation();
  const router = useRouter();

  const { data: events = [], isLoading, isError } = useListAllManagedPricingEvents(universeId);

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

  if (events.length === 0) {
    return (
      <EmptyState
        title={translate('Heading.PriceTests')}
        description={translate('Description.PriceTestsEmptyState')}
        size='small'
        illustration='chart'
      />
    );
  }

  return <ManagedPricingEventsTable universeId={universeId} events={events} />;
}

export default withTranslation(PricingActivityTabContainer, [
  TranslationNamespace.Table,
  TranslationNamespace.Creations,
  TranslationNamespace.ManagedPricing,
]);
