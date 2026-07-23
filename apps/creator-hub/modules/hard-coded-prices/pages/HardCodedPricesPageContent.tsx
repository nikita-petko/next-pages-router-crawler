/* istanbul ignore file */
import { useRouter } from 'next/router';
import { useTranslation, withTranslation } from '@rbx/intl';
import { useIsManagedPricingAvailable } from '@modules/managed-pricing/hooks/useIsManagedPricingAvailable';
import EmptyState from '@modules/miscellaneous/components/EmptyState/EmptyState';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import AccessDeniedPage from '@modules/miscellaneous/error/components/AccessDeniedPage';
import PageNotFound from '@modules/miscellaneous/error/components/PageNotFound';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { ProgressCircleLoader } from '@modules/monetization-shared/loaders';
import useCurrentGame from '@modules/providers/game/hooks/useCurrentGame';
import { useUniversePermissions } from '@modules/react-query/organizations';
import HardCodedPricesTableContainer from '../containers/HardCodedPricesTableContainer';
import { useGetHardCodedPricesSummary } from '../queries/useGetHardCodedPricesSummary';

function HardCodedPricesPageContent({ universeId }: { universeId: number }) {
  const router = useRouter();
  const { translate } = useTranslation();

  const { gameDetails, isLoadingGame, isErrorLoadingGame } = useCurrentGame();

  const {
    data: permissions,
    isLoading: isLoadingPermissions,
    isError: isErrorPermissions,
  } = useUniversePermissions(universeId);
  const {
    data: isManagedPricingAvailable,
    isLoading: isLoadingManagedPricingStatus,
    isError: isErrorManagedPricingStatus,
  } = useIsManagedPricingAvailable(universeId);
  const {
    data: hardCodedPricesSummary,
    isLoading: isLoadingHardCodedPricesSummary,
    isError: isErrorHardCodedPricesSummary,
  } = useGetHardCodedPricesSummary({ universeId });

  const isLoading =
    isLoadingManagedPricingStatus ||
    isLoadingPermissions ||
    isLoadingGame ||
    isLoadingHardCodedPricesSummary;
  if (isLoading) {
    return <ProgressCircleLoader />;
  }

  const isError =
    isErrorManagedPricingStatus ||
    isErrorPermissions ||
    isErrorHardCodedPricesSummary ||
    isErrorLoadingGame;
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

  // Feature flag gate - will eventually be removed once the MP is fully launched
  if (!isManagedPricingAvailable) {
    return <PageNotFound />;
  }

  // If no summary after load and error check, or if no violations found, show no hard-coded prices
  if (!hardCodedPricesSummary?.scanJobId || !hardCodedPricesSummary.hasViolations) {
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
    <HardCodedPricesTableContainer
      universeId={universeId}
      scanJobId={hardCodedPricesSummary.scanJobId}
      rootPlaceId={gameDetails?.rootPlaceId ?? 0}
    />
  );
}

export default withTranslation(HardCodedPricesPageContent, [
  TranslationNamespace.Error,
  TranslationNamespace.Table,
  TranslationNamespace.Creations,
  TranslationNamespace.HardCodedPrices,
]);
