import {
  AnalyticsPageTitle,
  StatusBanners,
  analyticsAnalyticsHomeNavigationItem,
} from '@modules/charts-generic';
import {
  FormattedText,
  translationKey,
  withNamespaceSwitchedTranslation,
} from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import React, { FunctionComponent, useCallback, useMemo } from 'react';
import {
  useRAQIV2TranslationDependencies,
  AnalyticsHomePageLayout,
  logTabLoad,
  useAnalyticsHomeClient,
  useApiRequest,
  useOwner,
  GeneralBreakglassBanner,
  MonetizationBreakglassBanner,
  useIsGeneralBreakglassBannerOn,
  useIsMonetizationBreakglassBannerOn,
  BannerCustomTarget,
  useAnalyticsBannerConfiguration,
} from '@modules/experience-analytics-shared';
import { AnalyticsHomeTab } from '@modules/clients/analytics';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { Grid } from '@rbx/ui';
import { useSettings } from '@modules/settings';
import AvatarTabContent from './AvatarTab/AvatarTabContent';
import MigratedAvatarTabContent from './AvatarTab/MigratedAvatarTabContent';
import ExperiencesTabContentContainer from './ExperienceTab/ExperiencesTabContentContainer';
import StoreTabContent from './StoreTab/StoreTabContent';
import ShareLinksTabContent from './ShareLinksTab/ShareLinksTabContent';

type typeTabs = {
  key: string;
  label: FormattedText;
  content: React.JSX.Element;
};
const analyticsHomeBannerTargets = [BannerCustomTarget.AnalyticOverviews];

const AnalyticsHomePageContent: FunctionComponent = () => {
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const { translate } = useRAQIV2TranslationDependencies();
  const analyticsHomeApiClient = useAnalyticsHomeClient();
  const owner = useOwner();
  const isGeneralBreakglassBannerOn = useIsGeneralBreakglassBannerOn();
  const isMonetizationBreakglassBannerOn = useIsMonetizationBreakglassBannerOn();
  const { data: activeBanners } = useAnalyticsBannerConfiguration(analyticsHomeBannerTargets);
  const { settings, isFetched: isSettingsFetched } = useSettings();
  const { enableMigratedAvatarAnalyticsPage } = settings;

  const fetchTabOrder = useCallback(async () => {
    if (!owner.isFetched) return null;
    const result = await analyticsHomeApiClient.getAnalyticsHomeTabOrder({
      ownerId: owner.ownerId,
      ownerType: owner.ownerType,
    });
    logTabLoad(unifiedLogger, { defaultTab: result.homeTabOrders[0], tabs: result.homeTabOrders });
    return result;
  }, [analyticsHomeApiClient, owner, unifiedLogger]);
  const { data: tabOrder, isResponseFailed } = useApiRequest(fetchTabOrder);

  const avatarTabContent = useMemo(() => {
    if (!isSettingsFetched) {
      // Render empty element while settings are loading to prevent flicker
      return <div />;
    }
    return enableMigratedAvatarAnalyticsPage ? <MigratedAvatarTabContent /> : <AvatarTabContent />;
  }, [isSettingsFetched, enableMigratedAvatarAnalyticsPage]);

  const avatarTab = useMemo(
    () => ({
      key: AnalyticsHomeTab.Avatar,
      label: translate(translationKey('Heading.AvatarItems', TranslationNamespace.AvatarAnalytics)),
      content: avatarTabContent,
    }),
    [translate, avatarTabContent],
  );

  const experiencesTab = useMemo(
    () => ({
      key: AnalyticsHomeTab.Experience,
      label: translate(translationKey('Heading.ExperiencesTab', TranslationNamespace.Analytics)),
      content: <ExperiencesTabContentContainer />,
    }),
    [translate],
  );

  const storeTab = useMemo(
    () => ({
      key: 'Store',
      label: translate(translationKey('Heading.StoreItems', TranslationNamespace.StoreAnalytics)),
      content: <StoreTabContent />,
    }),
    [translate],
  );

  const shareLinksTab = useMemo(
    () => ({
      key: 'ShareLinks',
      label: translate(
        translationKey('Heading.ShareLinks', TranslationNamespace.ShareLinkAnalytics),
      ),
      content: <ShareLinksTabContent />,
    }),
    [translate],
  );

  const orderedTabs = useMemo(() => {
    if (!tabOrder?.homeTabOrders || isResponseFailed) {
      const tabs: typeTabs[] = [experiencesTab, avatarTab];
      tabs.push(storeTab);

      const experienceIndex = tabs.findIndex((item) => item.key === AnalyticsHomeTab.Experience);
      if (experienceIndex !== -1) {
        tabs.splice(experienceIndex + 1, 0, shareLinksTab);
      }

      return tabs;
    }

    const tabs: typeTabs[] = tabOrder.homeTabOrders.map((tab) => {
      switch (tab) {
        case AnalyticsHomeTab.Experience:
          return experiencesTab;
        case AnalyticsHomeTab.Avatar:
          return avatarTab;
        default: {
          const exhaustiveCheck: never = tab;
          throw new Error(`Unhandled tab type ${exhaustiveCheck}`);
        }
      }
    });
    tabs.push(storeTab);

    const experienceIndex = tabs.findIndex((item) => item.key === AnalyticsHomeTab.Experience);
    if (experienceIndex !== -1) {
      tabs.splice(experienceIndex + 1, 0, shareLinksTab);
    }

    return tabs;
  }, [
    tabOrder?.homeTabOrders,
    isResponseFailed,
    experiencesTab,
    avatarTab,
    storeTab,
    shareLinksTab,
  ]);

  const description = useMemo(() => {
    const banners = [];

    if (activeBanners.length > 0) {
      banners.push(
        <Grid item sx={{ marginTop: '16px' }} key='status-banner' XSmall={12}>
          <StatusBanners bannerConfigs={activeBanners} />
        </Grid>,
      );
    } else {
      if (isGeneralBreakglassBannerOn) {
        banners.push(
          <Grid item sx={{ marginTop: '16px' }} key='general-breakglass-banner' XSmall={12}>
            <GeneralBreakglassBanner />
          </Grid>,
        );
      }
      if (isMonetizationBreakglassBannerOn) {
        banners.push(
          <Grid item sx={{ marginTop: '16px' }} key='monetization-breakglass-banner' XSmall={12}>
            <MonetizationBreakglassBanner />
          </Grid>,
        );
      }
    }

    return banners.length > 0 ? <Grid container>{banners}</Grid> : undefined;
  }, [activeBanners, isGeneralBreakglassBannerOn, isMonetizationBreakglassBannerOn]);

  return (
    <AnalyticsHomePageLayout
      title={
        <AnalyticsPageTitle
          text={translate(translationKey('Heading.Analytics', TranslationNamespace.Analytics))}
        />
      }
      description={description}
      controls={[]}
      tabs={orderedTabs}
      navigationItem={analyticsAnalyticsHomeNavigationItem}
    />
  );
};
export default withNamespaceSwitchedTranslation(AnalyticsHomePageContent, [
  TranslationNamespace.AvatarAnalytics,
  TranslationNamespace.Analytics,
  TranslationNamespace.StoreAnalytics,
  TranslationNamespace.ShareLinkAnalytics,
]);
