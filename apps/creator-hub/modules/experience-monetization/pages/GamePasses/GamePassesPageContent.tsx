import { useMemo } from 'react';
import { withTranslation } from '@rbx/intl';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { analyticsItemMonetizationPassesNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import CreatorAnalyticsLayout from '@modules/experience-analytics-shared/components/RAQIV2/layout/CreatorAnalyticsLayout';
import useOwner from '@modules/experience-analytics-shared/context/useOwner';
import { useAnalyticsExperiencePermissions } from '@modules/experience-analytics-shared/hooks/useAnalyticsPermissions';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import ManagedPricingPromotionBanner from '@modules/managed-pricing/banners/ManagedPricingPromotionBanner';
import { isManagedPricingAvailable } from '@modules/managed-pricing/hooks/useIsManagedPricingAvailable';
import { useGetManagedPricingStatus } from '@modules/managed-pricing/queries/useGetManagedPricingStatus';
import AccessDeniedPage from '@modules/miscellaneous/error/components/AccessDeniedPage';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { ProgressCircleLoader } from '@modules/monetization-shared/loaders';
import GenericTabbedPageLayout, {
  type TabConfig,
} from '@modules/monetization-shared/tabs/GenericTabbedPageLayout';
import GamePassesTableContainer from '@modules/passes/containers/GamePassesTableContainer';
import { useUniversePermissions } from '@modules/react-query/organizations';
import ItemMonetizationTabs from '../../constants/ItemMonetizationTabs';
import { useItemMonetizationClient } from '../../context/ItemMonetizationClientProvider';
import getTransactionPageUrl from '../../utils/getTransactionPageUrl';
import buildGamePassPageConfig from './buildGamePassPageConfig';

function GamePassesPageContent({ universeId }: { universeId: number }) {
  const { translate } = useRAQIV2TranslationDependencies();
  const client = useItemMonetizationClient();

  const { data: permissions, isLoading: isLoadingPermissions } = useUniversePermissions(universeId);
  const { userCanViewAnalyticsForUniverse, isPending: isPendingAnalyticsExperiencePermissions } =
    useAnalyticsExperiencePermissions(universeId);

  const { data: managedPricingStatus, isLoading: isLoadingManagedPricingStatus } =
    useGetManagedPricingStatus(universeId);

  const managedPricingOnboardingStatus = managedPricingStatus?.status;
  const hasRegionalPricingSource = managedPricingStatus?.sources?.includes('RegionalPricing');

  const creationsTab = useMemo<TabConfig<ItemMonetizationTabs>>(
    () => ({
      key: ItemMonetizationTabs.Creations,
      label: translate(translationKey('Heading.Creations', TranslationNamespace.Navigation)),
      content: (
        <GamePassesTableContainer
          universeId={universeId}
          managedPricingOnboardingStatus={managedPricingOnboardingStatus}
        />
      ),
    }),
    [translate, universeId, managedPricingOnboardingStatus],
  );

  const owner = useOwner();
  const transactionPageUrl = useMemo(() => getTransactionPageUrl(owner), [owner]);

  const itemMonetizationPageConfig = useMemo(
    () => buildGamePassPageConfig(universeId, client, transactionPageUrl),
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

  const orderedTabs = useMemo(() => {
    const tabs: TabConfig<ItemMonetizationTabs>[] = [];
    if (permissions?.monetizeExperience) {
      tabs.push(creationsTab);
    }
    if (userCanViewAnalyticsForUniverse) {
      tabs.push(analyticsTab);
    }
    return tabs;
  }, [permissions, userCanViewAnalyticsForUniverse, creationsTab, analyticsTab]);

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
          page='monetization/passes'
          fromRegionalPricing={hasRegionalPricingSource}
        />
      )}

      <GenericTabbedPageLayout
        tabs={orderedTabs}
        defaultTab={orderedTabs[0].key}
        navigationItem={analyticsItemMonetizationPassesNavigationItem}
      />
    </div>
  );
}

export default withTranslation(GamePassesPageContent, [
  TranslationNamespace.Navigation,
  TranslationNamespace.Analytics,
  TranslationNamespace.AssetTypes,
  TranslationNamespace.AvatarAnalytics,
]);
