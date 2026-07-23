/* istanbul ignore file */
import { useRouter } from 'next/router';
import { useTranslation, withTranslation } from '@rbx/intl';
import { useGetDeveloperProductConfig } from '@modules/developer-products/queries/useGetDeveloperProductConfig';
import { isManagedPricingAvailable } from '@modules/managed-pricing/hooks/useIsManagedPricingAvailable';
import { useGetGiftingTradingStatus } from '@modules/managed-pricing/queries/useGetGiftingTradingStatus';
import { useGetManagedPricingStatus } from '@modules/managed-pricing/queries/useGetManagedPricingStatus';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import AccessDeniedPage from '@modules/miscellaneous/error/components/AccessDeniedPage';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { ProgressCircleLoader } from '@modules/monetization-shared/loaders';
import { useUniversePermissions } from '@modules/react-query/organizations';
import { usePersonalizedShop } from '@modules/shops/hooks/usePersonalizedShop';
import ConfigureDeveloperProductFormV2 from '../components/ConfigureDeveloperProductFormV2/ConfigureDeveloperProductFormV2';
import ConfigureDeveloperProductFormV3 from '../components/ConfigureDeveloperProductFormV3/ConfigureDeveloperProductFormV3';
import { parseDeveloperProductConfig } from '../utils/developerProductUtils';

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

  const { data: managedPricingOnboardingStatus, isLoading: isLoadingManagedPricingStatus } =
    useGetManagedPricingStatus(universeId, {
      select: (data) => data.status,
    });

  const { data: shop, isLoading: isLoadingShop } = usePersonalizedShop(universeId);
  const shopId = shop?.shopId;

  const isLoading =
    isLoadingPermissions ||
    isDeveloperProductInitialLoading ||
    isLoadingManagedPricingStatus ||
    isLoadingShop;

  if (isLoading) {
    return <ProgressCircleLoader />;
  }

  if (permissions?.monetizeExperience === false) {
    return <AccessDeniedPage />;
  }

  // Note dev product is guaranteed to be non-null post query checks
  if (isDeveloperProductError || !developerProduct) {
    return (
      <FailureView
        title={translate('Heading.FailedToLoadPage')}
        message={translate('Message.FailedToLoadPage')}
        buttonText={translate('Action.FailedToLoadPage')}
        onReload={router.reload}
      />
    );
  }

  const showManagedPricing = isManagedPricingAvailable(managedPricingOnboardingStatus);

  if (showManagedPricing) {
    return (
      <ConfigureDeveloperProductFormV3
        universeId={universeId}
        productId={productId}
        developerProduct={developerProduct}
        giftingTradingStatus={giftingTradingStatus}
        managedPricingOnboardingStatus={managedPricingOnboardingStatus}
        isPending={isDeveloperProductRefetching}
        shopId={shopId}
      />
    );
  }

  return (
    <ConfigureDeveloperProductFormV2
      universeId={universeId}
      productId={productId}
      developerProduct={developerProduct}
      giftingTradingStatus={giftingTradingStatus}
      isPending={isDeveloperProductRefetching}
      shopId={shopId}
    />
  );
}

export default withTranslation(ConfigureDeveloperProductContainer, [
  TranslationNamespace.Creations,
  TranslationNamespace.Controls,
  TranslationNamespace.Error,
  TranslationNamespace.ConfigureItem,
  TranslationNamespace.DeveloperProducts,
  TranslationNamespace.ManagedPricing,
  TranslationNamespace.RegionalPricing,
]);
