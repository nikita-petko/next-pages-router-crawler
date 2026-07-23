/* istanbul ignore file */
import { useRouter } from 'next/router';
import { StatusCodes } from '@rbx/core';
import { useTranslation, withTranslation } from '@rbx/intl';
import { useUniversePermissions } from '@modules/react-query/organizations';
import { PageLoading } from '@modules/miscellaneous/common';
import { ErrorPage, PageNotFound } from '@modules/miscellaneous/error';
import { FailureView } from '@modules/miscellaneous/common/components/FailureView';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
// eslint-disable-next-line no-restricted-imports -- intended
import useCurrentGame from '@modules/providers/game/hooks/useCurrentGame';
import { useGetManagedPricingStatus } from '../queries/useGetManagedPricingStatus';
import HardCodedPricesTable from '../hard-coded-prices/components/HardCodedPricesTable';
import { MOCK_HARD_CODED_PRICE_INSTANCES } from '../hard-coded-prices/mocks';

function HardCodedPricesPageContent({ universeId }: { universeId: number }) {
  const router = useRouter();
  const { translate } = useTranslation();
  const { gameDetails, isLoadingGame } = useCurrentGame();

  const {
    data: permissions,
    isLoading: isLoadingPermissions,
    isError: isErrorPermissions,
  } = useUniversePermissions(universeId);
  const {
    data: managedPricingStatus,
    isLoading: isLoadingManagedPricingStatus,
    isError: isErrorManagedPricingStatus,
  } = useGetManagedPricingStatus(universeId);

  const isLoading = isLoadingManagedPricingStatus || isLoadingPermissions || isLoadingGame;
  if (isLoading) {
    return <PageLoading />;
  }

  const isError = isErrorManagedPricingStatus || isErrorPermissions;
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

  const hasPermission = permissions?.monetizeExperience || permissions?.viewAnalytics;
  if (hasPermission === false) {
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
  }

  const isManagedPricingEligible =
    managedPricingStatus?.status === 'Pending' || managedPricingStatus?.status === 'Accepted';
  if (!isManagedPricingEligible) {
    return <PageNotFound />;
  }

  // TODO: hook in Hard-coded prices data

  return (
    <HardCodedPricesTable
      instances={MOCK_HARD_CODED_PRICE_INSTANCES}
      universeId={universeId}
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
