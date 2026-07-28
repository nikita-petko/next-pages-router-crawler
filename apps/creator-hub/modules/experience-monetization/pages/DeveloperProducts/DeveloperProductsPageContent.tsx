import { useMemo } from 'react';
import { withTranslation } from '@rbx/intl';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { analyticsItemMonetizationDeveloperProductsNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import DeveloperProductsTableContainer from '@modules/developer-products/containers/DeveloperProductsTableContainer';
import { useIsAnyDeveloperProductManagedPricingEnabled } from '@modules/developer-products/hooks/useIsAnyDeveloperProductManagedPricingEnabled';
import { useIsAnyDeveloperProductRegionalPricingEnabled } from '@modules/developer-products/hooks/useIsAnyDeveloperProductRegionalPricingEnabled';
import CreatorAnalyticsLayout from '@modules/experience-analytics-shared/components/RAQIV2/layout/CreatorAnalyticsLayout';
import useOwner from '@modules/experience-analytics-shared/context/useOwner';
import { useAnalyticsExperiencePermissions } from '@modules/experience-analytics-shared/hooks/useAnalyticsPermissions';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import ManagedPricingPromotionBanner from '@modules/managed-pricing/banners/ManagedPricingPromotionBanner';
import GiftingTradingWarningBannerV2 from '@modules/managed-pricing/gifting-trading/GiftingTradingWarningBannerV2';
import { shouldShowGiftingTradingReminder } from '@modules/managed-pricing/gifting-trading/utils';
import { isManagedPricingAvailable } from '@modules/managed-pricing/hooks/useIsManagedPricingAvailable';
import { useGetGiftingTradingStatus } from '@modules/managed-pricing/queries/useGetGiftingTradingStatus';
import { useGetManagedPricingStatus } from '@modules/managed-pricing/queries/useGetManagedPricingStatus';
import AccessDeniedPage from '@modules/miscellaneous/error/components/AccessDeniedPage';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useMonetizationFlags } from '@modules/monetization-shared/flags/useMonetizationFlags';
import { ProgressCircleLoader } from '@modules/monetization-shared/loaders';
import GenericTabbedPageLayout, {
  type TabConfig,
} from '@modules/monetization-shared/tabs/GenericTabbedPageLayout';
import { useUniversePermissions } from '@modules/react-query/organizations';
import GiftingTradingWarningBanner from '@modules/regional-pricing/components/GiftingTradingWarningBanner';
import ItemMonetizationTabs from '../../constants/ItemMonetizationTabs';
import { useItemMonetizationClient } from '../../context/ItemMonetizationClientProvider';
import getTransactionPageUrl from '../../utils/getTransactionPageUrl';
import buildDevProductsPageConfig from './buildDevProductsPageConfig';

function DeveloperProductsPageContent({ universeId }: { universeId: number }) {
  const { translate } = useRAQIV2TranslationDependencies();
  const { userCanViewAnalyticsForUniverse, isPending: isPendingAnalyticsExperiencePermissions } =
    useAnalyticsExperiencePermissions(universeId);
  const { data: permissions, isLoading: isLoadingPermissions } = useUniversePermissions(universeId);
  const client = useItemMonetizationClient();

  const { data: { giftingTradingStatus } = {} } = useGetGiftingTradingStatus(universeId, {
    enabled: !!permissions?.monetizeExperience,
  });

  const { data: managedPricingStatus, isLoading: isLoadingManagedPricingStatus } =
    useGetManagedPricingStatus(universeId);

  const managedPricingOnboardingStatus = managedPricingStatus?.status;
  const hasRegionalPricingSource = managedPricingStatus?.sources?.includes('RegionalPricing');

  // Note we make this dependent only on gifting trading status which should run against cache.
  // The actual query is kicked off in the table container.
  const { data: isAnyDeveloperProductRegionalPricingEnabled = false } =
    useIsAnyDeveloperProductRegionalPricingEnabled(
      { universeId },
      { enabled: shouldShowGiftingTradingReminder(giftingTradingStatus) },
    );

  const { data: isAnyDeveloperProductManagedPricingEnabled = false } =
    useIsAnyDeveloperProductManagedPricingEnabled(
      { universeId },
      { enabled: shouldShowGiftingTradingReminder(giftingTradingStatus) },
    );

  const { isProductArchiveEnabled } = useMonetizationFlags('isProductArchiveEnabled');

  const owner = useOwner();
  const transactionPageUrl = useMemo(() => getTransactionPageUrl(owner), [owner]);

  const creationsTab = useMemo<TabConfig<ItemMonetizationTabs>>(
    () => ({
      key: ItemMonetizationTabs.Creations,
      label: translate(translationKey('Heading.Creations', TranslationNamespace.Navigation)),
      content: (
        <DeveloperProductsTableContainer
          universeId={universeId}
          managedPricingOnboardingStatus={managedPricingOnboardingStatus}
          giftingTradingStatus={giftingTradingStatus}
          // false = show only active products; undefined = feature flag off, no filtering
          isArchived={isProductArchiveEnabled ? false : undefined}
        />
      ),
    }),
    [
      translate,
      universeId,
      managedPricingOnboardingStatus,
      giftingTradingStatus,
      isProductArchiveEnabled,
    ],
  );

  const itemMonetizationPageConfig = useMemo(
    () => buildDevProductsPageConfig(universeId, client, transactionPageUrl),
    [universeId, client, transactionPageUrl],
  );

  const analyticsTab = useMemo<TabConfig<ItemMonetizationTabs>>(
    () => ({
      key: ItemMonetizationTabs.Analytics,
      label: translate(translationKey('Heading.Analytics', TranslationNamespace.Analytics)),
      content: <CreatorAnalyticsLayout config={itemMonetizationPageConfig} />,
    }),
    [itemMonetizationPageConfig, translate],
  );

  const archivedTab = useMemo<TabConfig<ItemMonetizationTabs>>(
    () => ({
      key: ItemMonetizationTabs.Archived,
      label: translate(translationKey('Heading.Archived', TranslationNamespace.Navigation)),
      content: <DeveloperProductsTableContainer universeId={universeId} isArchived />,
    }),
    [translate, universeId],
  );

  const orderedTabs = useMemo(() => {
    const tabs: TabConfig<ItemMonetizationTabs>[] = [];
    if (permissions?.monetizeExperience) {
      tabs.push(creationsTab);
    }
    if (userCanViewAnalyticsForUniverse) {
      tabs.push(analyticsTab);
    }
    if (isProductArchiveEnabled && permissions?.monetizeExperience) {
      tabs.push(archivedTab);
    }
    return tabs;
  }, [
    permissions,
    userCanViewAnalyticsForUniverse,
    isProductArchiveEnabled,
    creationsTab,
    analyticsTab,
    archivedTab,
  ]);

  if (
    isPendingAnalyticsExperiencePermissions ||
    isLoadingPermissions ||
    isLoadingManagedPricingStatus
  ) {
    return <ProgressCircleLoader />;
  }

  if (orderedTabs.length === 0) {
    return <AccessDeniedPage />;
  }

  return (
    <div className='flex flex-col gap-xxlarge margin-bottom-large'>
      {isManagedPricingAvailable(managedPricingOnboardingStatus) && (
        <ManagedPricingPromotionBanner
          universeId={universeId}
          page='monetization/developer-products'
          fromRegionalPricing={hasRegionalPricingSource}
        />
      )}

      {isManagedPricingAvailable(managedPricingOnboardingStatus) ? (
        <GiftingTradingWarningBannerV2
          universeId={universeId}
          page='/developer-products'
          giftingTradingStatus={giftingTradingStatus}
          // Only show gifting trading warnings if any developer product loaded is managed pricing enabled
          enabled={isAnyDeveloperProductManagedPricingEnabled}
        />
      ) : (
        <GiftingTradingWarningBanner
          universeId={universeId}
          page='/developer-products'
          giftingTradingStatus={giftingTradingStatus}
          // Only show gifting trading warnings if any developer product loaded is regional pricing enabled
          enabled={isAnyDeveloperProductRegionalPricingEnabled}
        />
      )}

      <GenericTabbedPageLayout
        tabs={orderedTabs}
        defaultTab={orderedTabs[0].key}
        navigationItem={analyticsItemMonetizationDeveloperProductsNavigationItem}
      />
    </div>
  );
}

export default withTranslation(DeveloperProductsPageContent, [
  TranslationNamespace.Navigation,
  TranslationNamespace.Analytics,
  TranslationNamespace.AssetTypes,
]);
