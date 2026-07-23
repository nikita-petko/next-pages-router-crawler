/* istanbul ignore file */
import { useRouter } from 'next/router';
import { StatusCodes } from '@rbx/core';
import { useTranslation, withTranslation } from '@rbx/intl';
import { CircularProgress, Grid } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { FailureView } from '@modules/miscellaneous/common/components/FailureView';
import { ErrorPage } from '@modules/miscellaneous/error';
import { useGetGiftingTradingStatus } from '@modules/managed-pricing/queries/useGetGiftingTradingStatus';
import { useGetExperienceStoreState } from '@modules/experience-store/queries/useGetExperienceStoreState';
import { useUniversePermissions } from '@modules/react-query/organizations';
import { useGetDeveloperProductConfig } from '@modules/developer-products/queries/useGetDeveloperProductConfig';
import { parseDeveloperProductConfig } from '../utils/developerProductUtils';
import ConfigureDeveloperProductFormV2 from '../components/ConfigureDeveloperProductFormV2/ConfigureDeveloperProductFormV2';

type Props = {
  universeId: number;
  productId: number;
};

function ConfigureDeveloperProductContainer({ universeId, productId }: Props) {
  const { translate } = useTranslation();
  const router = useRouter();

  const { data: permissions, isLoading: isLoadingPermissions } = useUniversePermissions(universeId);

  const {
    data: developerProduct,
    isLoading: isDeveloperProductInitialLoading, // For first fetch (v4 isInitialLoading)
    isRefetching: isDeveloperProductRefetching, // For re-fetch
    isError: isDeveloperProductError,
  } = useGetDeveloperProductConfig(
    { universeId, productId },
    { select: parseDeveloperProductConfig },
  );

  const { data: { giftingTradingStatus } = {} } = useGetGiftingTradingStatus(universeId, {
    enabled: !!permissions?.monetizeExperience,
  });

  const { data: experienceStoreState, isLoading: isLoadingExperienceStoreState } =
    useGetExperienceStoreState(universeId, {
      enabled: !!permissions?.monetizeExperience,
    });

  const isLoading =
    isLoadingPermissions || isLoadingExperienceStoreState || isDeveloperProductInitialLoading;

  if (isLoading) {
    return (
      <Grid container minHeight={450} justifyContent='center' alignItems='center'>
        <CircularProgress />
      </Grid>
    );
  }

  if (permissions?.monetizeExperience === false) {
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
  }

  if (isDeveloperProductError) {
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
    <ConfigureDeveloperProductFormV2
      universeId={universeId}
      productId={productId}
      developerProduct={developerProduct!} // Note - this will be defined after the loading + error check
      giftingTradingStatus={giftingTradingStatus}
      isEligibleForExternalStorePurchase={
        experienceStoreState?.universeTestModeState === 'Enabled' ||
        experienceStoreState?.universeStorePageStateType === 'Enabled'
      }
      isPending={isDeveloperProductRefetching}
    />
  );
}

export default withTranslation(ConfigureDeveloperProductContainer, [
  TranslationNamespace.Creations,
  TranslationNamespace.Controls,
  TranslationNamespace.Error,
  TranslationNamespace.ConfigureItem,
  TranslationNamespace.DeveloperProducts,
  TranslationNamespace.RegionalPricing,
]);
