/* istanbul ignore file */
import { useRouter } from 'next/router';
import { CircularProgress, Grid } from '@rbx/ui';
import { StatusCodes } from '@rbx/core';
import { useTranslation, withTranslation } from '@rbx/intl';
import { FailureView } from '@modules/miscellaneous/common/components/FailureView';
import ErrorPage from '@modules/miscellaneous/error/components/ErrorPage';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useUniversePermissions } from '@modules/react-query/organizations';
import ConfigureSalesForm from '../components/ConfigureSalesForm/ConfigureSalesForm';
import ConfigurePassForm from '../components/ConfigurePassForm/ConfigurePassForm';
import { useCurrentPass } from '../contexts/PassContext';

export enum EConfigurePassPageType {
  Sales,
  GeneralInfo,
}

type Props = {
  universeId: number;
  passId: number;
  pageType: EConfigurePassPageType;
};

const ConfigurePassContainer = ({ universeId, passId, pageType }: Props) => {
  const router = useRouter();
  const { translate } = useTranslation();

  const { data: permissions, isLoading: isLoadingPermissions } = useUniversePermissions(universeId);

  const { passDetails: pass, isPassLoading, isPassDetailsRefetching } = useCurrentPass();

  if (isLoadingPermissions || isPassLoading) {
    return (
      <Grid container justifyContent='center' alignItems='center'>
        <CircularProgress />
      </Grid>
    );
  }

  if (!pass) {
    return (
      <FailureView
        title={translate('Heading.FailedToLoadPage')}
        message={translate('Message.FailedToLoadPage')}
        buttonText={translate('Action.FailedToLoadPage')}
        onReload={router.reload}
      />
    );
  }

  if (permissions?.monetizeExperience === false) {
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
  }

  if (pageType === EConfigurePassPageType.GeneralInfo) {
    return (
      <ConfigurePassForm
        universeId={universeId}
        passId={passId}
        name={pass.name}
        description={pass.description}
        imageAssetId={pass.iconAssetId}
        lastUpdated={pass.updatedTimestamp}
      />
    );
  }

  // priceInformation is undefined for newly created passes, we enable regional pricing for these new passes by default
  const isRegionalPricingEnabled =
    pass.priceInformation?.enabledFeatures.includes('RegionalPricing');

  const isInActivePriceOptimizationExperiment =
    pass.priceInformation?.enabledFeatures.includes('PriceOptimization') ?? false;

  return (
    <ConfigureSalesForm
      universeId={universeId}
      passId={passId}
      isForSale={pass.isForSale ?? false}
      price={pass.priceInformation?.defaultPriceInRobux}
      isRegionalPricingEnabled={isRegionalPricingEnabled ?? true} // Enabled by default for new passes
      isInActivePriceOptimizationExperiment={isInActivePriceOptimizationExperiment}
      isPending={isPassDetailsRefetching}
    />
  );
};

export default withTranslation(ConfigurePassContainer, [
  TranslationNamespace.ConfigureItem,
  TranslationNamespace.Passes,
  TranslationNamespace.Error,
  TranslationNamespace.RegionalPricing,
]);
