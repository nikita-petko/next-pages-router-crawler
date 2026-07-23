/* istanbul ignore file */
import { withTranslation } from '@rbx/intl';
import { isManagedPricingAvailable } from '@modules/managed-pricing/hooks/useIsManagedPricingAvailable';
import { useGetGiftingTradingStatus } from '@modules/managed-pricing/queries/useGetGiftingTradingStatus';
import { useGetManagedPricingStatus } from '@modules/managed-pricing/queries/useGetManagedPricingStatus';
import AccessDeniedPage from '@modules/miscellaneous/error/components/AccessDeniedPage';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { ProgressCircleLoader } from '@modules/monetization-shared/loaders';
import { useUniversePermissions } from '@modules/react-query/organizations';
import { usePersonalizedShop } from '@modules/shops/hooks/usePersonalizedShop';
import { useAvailableCategories } from '@modules/shops/item-catalog/hooks/useAvailableCategories';
import CreateDeveloperProductFormV2 from '../components/CreateDeveloperProductFormV2/CreateDeveloperProductFormV2';
import CreateDeveloperProductFormV3 from '../components/CreateDeveloperProductFormV3/CreateDeveloperProductFormV3';

type Props = {
  universeId: number;
};

function CreateDeveloperProductContainer({ universeId }: Props) {
  const { data: permissions, isLoading: isLoadingPermissions } = useUniversePermissions(universeId);

  const { data: managedPricingOnboardingStatus, isLoading: isLoadingManagedPricingStatus } =
    useGetManagedPricingStatus(universeId, {
      select: (data) => data.status,
    });

  const { data: { giftingTradingStatus } = {}, isLoading: isLoadingGiftingTradingStatus } =
    useGetGiftingTradingStatus(universeId);

  const { data: shop, isLoading: isLoadingShop } = usePersonalizedShop(universeId);
  const shopId = shop?.shopId;
  const { categories: availableCategories, isLoading: isLoadingCategories } =
    useAvailableCategories({ shopId });

  const isLoading =
    isLoadingPermissions ||
    isLoadingManagedPricingStatus ||
    isLoadingGiftingTradingStatus ||
    isLoadingShop ||
    isLoadingCategories;
  if (isLoading) {
    return <ProgressCircleLoader />;
  }

  if (permissions?.monetizeExperience === false) {
    return <AccessDeniedPage />;
  }

  const showManagedPricing = isManagedPricingAvailable(managedPricingOnboardingStatus);
  if (showManagedPricing) {
    return (
      <CreateDeveloperProductFormV3
        universeId={universeId}
        managedPricingOnboardingStatus={managedPricingOnboardingStatus}
        giftingTradingStatus={giftingTradingStatus}
        shopId={shopId}
        availableCategories={availableCategories}
      />
    );
  }

  return <CreateDeveloperProductFormV2 universeId={universeId} shopId={shopId} />;
}

export default withTranslation(CreateDeveloperProductContainer, [
  TranslationNamespace.Creations,
  TranslationNamespace.ConfigureItem,
  TranslationNamespace.DeveloperProducts,
  TranslationNamespace.Error,
  TranslationNamespace.PriceOptimization,
  TranslationNamespace.RegionalPricing,
  TranslationNamespace.ManagedPricing,
  TranslationNamespace.PersonalizedShop,
]);
