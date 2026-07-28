/* istanbul ignore file */
import { useRouter } from 'next/router';
import { useTranslation, withTranslation } from '@rbx/intl';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import AccessDeniedPage from '@modules/miscellaneous/error/components/AccessDeniedPage';
import PageNotFound from '@modules/miscellaneous/error/components/PageNotFound';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useMonetizationFlags } from '@modules/monetization-shared/flags/useMonetizationFlags';
import { ProgressCircleLoader } from '@modules/monetization-shared/loaders';
import { useUniversePermissions } from '@modules/react-query/organizations';
import ExperimentProductDetailsTableContainer from '../experiment-details/containers/ExperimentProductDetailsTableContainer';
import ExperimentSummaryContainer from '../experiment-details/containers/ExperimentSummaryContainer';
import MockExperimentProductDetailsTableContainer from '../experiment-details/containers/MockExperimentProductDetailsTableContainer';
import UpcomingProductDetailsTableContainer from '../experiment-details/containers/UpcomingProductDetailsTableContainer';
import { useGetManagedPricingEvent } from '../queries/useGetManagedPricingEvent';

type Props = {
  universeId: number;
  eventId: string;
};

function ManagedPricingEventDetailsPageContent({ universeId, eventId }: Props) {
  const router = useRouter();
  const { translate } = useTranslation();

  const { mockManagedPricingEvents } = useMonetizationFlags('mockManagedPricingEvents');

  const {
    data: permissions,
    isLoading: isLoadingPermissions,
    isError: isErrorPermissions,
  } = useUniversePermissions(universeId);

  const {
    data: event,
    isLoading: isLoadingEvent,
    isError: isErrorEvent,
  } = useGetManagedPricingEvent({ universeId, eventId });

  const isLoading = isLoadingEvent || isLoadingPermissions;
  if (isLoading) {
    return <ProgressCircleLoader />;
  }

  const isError = isErrorEvent || isErrorPermissions;
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

  const hasPermission =
    permissions?.monetizeExperience === true || permissions?.viewAnalytics === true;
  if (permissions !== undefined && !hasPermission) {
    return <AccessDeniedPage />;
  }

  if (!event || event.eventType !== 'PriceTest') {
    return <PageNotFound />;
  }

  // Note: should dynamically render these based on event type - for now, we're only supporting price tests
  return (
    <div className='flex flex-col gap-xxlarge margin-bottom-large [container-type:inline-size]'>
      <ExperimentSummaryContainer
        {...event}
        universeId={universeId}
        experimentId={event.eventReferenceId}
      />

      <section className='flex flex-col'>
        <h2 className='text-heading-medium margin-top-none margin-bottom-[8px]'>
          {translate('Heading.ProductList')}
        </h2>
        <span className='text-body-medium margin-top-none margin-bottom-[16px]'>
          {translate('Description.PriceTestProductDetails')}
        </span>

        {event.status === 'Upcoming' ? (
          <UpcomingProductDetailsTableContainer universeId={universeId} />
        ) : mockManagedPricingEvents ? (
          <MockExperimentProductDetailsTableContainer
            universeId={universeId}
            experimentId={event.eventReferenceId}
            status={event.status}
          />
        ) : (
          <ExperimentProductDetailsTableContainer
            universeId={universeId}
            experimentId={event.eventReferenceId}
            status={event.status}
          />
        )}
      </section>
    </div>
  );
}

export default withTranslation(ManagedPricingEventDetailsPageContent, [
  TranslationNamespace.Error,
  TranslationNamespace.Table,
  TranslationNamespace.Creations,
  TranslationNamespace.ManagedPricing,
]);
