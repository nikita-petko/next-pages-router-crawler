/* istanbul ignore file */
import { useRouter } from 'next/router';
import { useTranslation, withTranslation } from '@rbx/intl';
import { isManagedPricingAvailable } from '@modules/managed-pricing/hooks/useIsManagedPricingAvailable';
import { useGetManagedPricingStatus } from '@modules/managed-pricing/queries/useGetManagedPricingStatus';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import AccessDeniedPage from '@modules/miscellaneous/error/components/AccessDeniedPage';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { ProgressCircleLoader } from '@modules/monetization-shared/loaders';
import { useUniversePermissions } from '@modules/react-query/organizations';
import { usePersonalizedShop } from '@modules/shops/hooks/usePersonalizedShop';
import ConfigurePassForm from '../components/ConfigurePassForm/ConfigurePassForm';
import ConfigurePassSalesFormV2 from '../components/ConfigurePassSalesFormV2/ConfigurePassSalesFormV2';
import ConfigureSalesForm from '../components/ConfigureSalesForm/ConfigureSalesForm';
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

  const { data: managedPricingOnboardingStatus, isLoading: isLoadingManagedPricingStatus } =
    useGetManagedPricingStatus(universeId, {
      select: (data) => data.status,
    });

  const { data: shop, isLoading: isLoadingShop } = usePersonalizedShop(universeId);
  const shopId = shop?.shopId;

  const isLoading =
    isLoadingPermissions || isPassLoading || isLoadingManagedPricingStatus || isLoadingShop;
  if (isLoading) {
    return <ProgressCircleLoader />;
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
    return <AccessDeniedPage />;
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
        shopId={shopId}
      />
    );
  }

  // priceInformation is undefined for newly created passes, we enable regional pricing for these new passes by default
  const isRegionalPricingEnabled =
    pass.priceInformation?.enabledFeatures.includes('RegionalPricing');

  const isInActivePriceOptimizationExperiment =
    pass.priceInformation?.enabledFeatures.includes('PriceOptimization') ?? false;

  const showManagedPricing = isManagedPricingAvailable(managedPricingOnboardingStatus);
  if (showManagedPricing) {
    return (
      <ConfigurePassSalesFormV2
        universeId={universeId}
        passId={passId}
        isForSale={pass.isForSale ?? false}
        price={pass.priceInformation?.defaultPriceInRobux}
        // TODO: handle "default managed pricing enabled" scenario since it's no longer dependent on price information
        isManagedPricingEnabled={
          // Note: isManagedPricingEnabled should always exist on this path as the backend flag is tightly fail-closed on this
          // Falling back to regional pricing as a default but see above todo
          pass.isManagedPricingEnabled ??
          pass.priceInformation?.enabledFeatures.includes('RegionalPricing') ??
          false
        }
        isInActivePriceOptimizationExperiment={isInActivePriceOptimizationExperiment}
        managedPricingOnboardingStatus={managedPricingOnboardingStatus}
        isPending={isPassDetailsRefetching}
        shopId={shopId}
      />
    );
  }

  return (
    <ConfigureSalesForm
      universeId={universeId}
      passId={passId}
      isForSale={pass.isForSale ?? false}
      price={pass.priceInformation?.defaultPriceInRobux}
      isRegionalPricingEnabled={isRegionalPricingEnabled ?? true} // Enabled by default for new passes
      isInActivePriceOptimizationExperiment={isInActivePriceOptimizationExperiment}
      isPending={isPassDetailsRefetching}
      shopId={shopId}
    />
  );
};

export default withTranslation(ConfigurePassContainer, [
  TranslationNamespace.Creations,
  TranslationNamespace.ConfigureItem,
  TranslationNamespace.Passes,
  TranslationNamespace.Error,
  TranslationNamespace.RegionalPricing,
  TranslationNamespace.ManagedPricing,
]);
