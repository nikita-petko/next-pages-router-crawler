import { Fragment, useMemo } from 'react';
import { analyticsItemMonetizationDeveloperProductsNavigationItem } from '@modules/charts-generic';
import { translationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { withTranslation } from '@rbx/intl';
import {
  CreatorAnalyticsLayout,
  ExperienceAnalyticsTabbedPageLayout,
  useOwner,
  useRAQIV2TranslationDependencies,
} from '@modules/experience-analytics-shared';
import { EmptyGrid, uninitializedUniverseId } from '@modules/miscellaneous/common';
import DeveloperProductsTableContainer from '@modules/developer-products/containers/DeveloperProductsTableContainer';
import { CircularProgress } from '@rbx/ui';
import DeveloperProductsRegionalPricingPromotionBanner from '@modules/regional-pricing/components/RegionalPricingPromotionBanner/DeveloperProductsRegionalPricingPromotionBanner';
import GiftingTradingWarningBanner, {
  shouldShowGiftingTradingReminder,
} from '@modules/regional-pricing/components/GiftingTradingWarningBanner';
import { useGetGiftingTradingStatus } from '@modules/managed-pricing/queries/useGetGiftingTradingStatus';
import { useIsAnyDeveloperProductRegionalPricingEnabled } from '@modules/developer-products/hooks/useIsAnyDeveloperProductRegionalPricingEnabled';
import { useUniversePermissions } from '@modules/react-query/organizations';
import { FeatureFlagNamespace } from '@modules/feature-flags/namespaces';
import { useFeatureFlagsForNamespace } from '@modules/feature-flags/context/FeatureFlagsProvider';
import ItemMonetizationTabs from '../../constants/ItemMonetizationTabs';
import buildDevProductsPageConfig from './buildDevProductsPageConfig';
import { useItemMonetizationClient } from '../../context/ItemMonetizationClientProvider';
import getTransactionPageUrl from '../../utils/getTransactionPageUrl';

function DeveloperProductsPageContent({ universeId }: { universeId: number }) {
  const { translate } = useRAQIV2TranslationDependencies();
  const { userCanViewAnalyticsForUniverse, isFetched } = useFeatureFlagsForNamespace(
    'userCanViewAnalyticsForUniverse',
    FeatureFlagNamespace.Analytics,
  );
  const { data: permissions, isLoading: isLoadingPermissions } = useUniversePermissions(universeId);
  const client = useItemMonetizationClient();

  const { data: { giftingTradingStatus } = {} } = useGetGiftingTradingStatus(universeId, {
    // Note: useUniverseResource returns uninitializedUniverseId instead of undefined when the universe is not loaded
    enabled:
      !!universeId && universeId !== uninitializedUniverseId && !!permissions?.monetizeExperience,
  });

  // Note we make this dependent only on gifting trading status which should run against cache.
  // The actual query is kicked off in the table container.
  const { data: isAnyDeveloperProductRegionalPricingEnabled = false } =
    useIsAnyDeveloperProductRegionalPricingEnabled(
      { universeId },
      { enabled: shouldShowGiftingTradingReminder(giftingTradingStatus) },
    );

  const owner = useOwner();
  const transactionPageUrl = useMemo(() => getTransactionPageUrl(owner), [owner]);

  const creationsTab = useMemo(
    () => ({
      key: ItemMonetizationTabs.Creations,
      label: translate(translationKey('Heading.Creations', TranslationNamespace.Navigation)),
      content: <DeveloperProductsTableContainer universeId={universeId} />,
    }),
    [translate, universeId],
  );

  const itemMonetizationPageConfig = useMemo(
    () => buildDevProductsPageConfig(universeId, client, transactionPageUrl),
    [universeId, client, transactionPageUrl],
  );

  const analyticsTab = useMemo(
    () => ({
      key: ItemMonetizationTabs.Analytics,
      label: translate(translationKey('Heading.Analytics', TranslationNamespace.Analytics)),
      content: <CreatorAnalyticsLayout config={itemMonetizationPageConfig} />,
    }),
    [itemMonetizationPageConfig, translate],
  );

  const orderedTabs = useMemo(() => {
    const tabs = [];
    if (permissions?.monetizeExperience) {
      tabs.push(creationsTab);
    }
    if (userCanViewAnalyticsForUniverse) {
      tabs.push(analyticsTab);
    }
    return tabs;
  }, [permissions, userCanViewAnalyticsForUniverse, creationsTab, analyticsTab]);

  const promoBanner = useMemo(() => {
    if (universeId === undefined) {
      return null;
    }

    return (
      <DeveloperProductsRegionalPricingPromotionBanner
        universeId={universeId}
        className='margin-y-none medium:margin-bottom-[-2px]'
      />
    );
  }, [universeId]);

  const description = useMemo(() => {
    const giftingTradingWarningBanner = (
      <GiftingTradingWarningBanner
        universeId={universeId}
        page='/developer-products'
        giftingTradingStatus={giftingTradingStatus}
        // Only show gifting trading warnings if any developer product loaded is regional pricing enabled
        enabled={isAnyDeveloperProductRegionalPricingEnabled}
        className='margin-bottom-[16px]'
      />
    );

    return (
      <Fragment>
        {giftingTradingWarningBanner}
        {promoBanner}
      </Fragment>
    );
  }, [promoBanner, universeId, giftingTradingStatus, isAnyDeveloperProductRegionalPricingEnabled]);

  if (!isFetched || isLoadingPermissions) {
    return (
      <EmptyGrid>
        <CircularProgress color='secondary' />
      </EmptyGrid>
    );
  }

  return (
    // eslint-disable-next-line deprecation/deprecation -- DSA-3202 to migrate
    <ExperienceAnalyticsTabbedPageLayout
      description={description}
      controls={[]}
      addHeroDivider={false}
      tabs={orderedTabs}
      navigationItem={analyticsItemMonetizationDeveloperProductsNavigationItem}
    />
  );
}

export default withTranslation(DeveloperProductsPageContent, [
  TranslationNamespace.Navigation,
  TranslationNamespace.Analytics,
  TranslationNamespace.AssetTypes,
]);
