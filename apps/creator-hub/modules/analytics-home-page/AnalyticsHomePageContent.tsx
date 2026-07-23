import type { FunctionComponent } from 'react';
import React, { useCallback, useMemo } from 'react';
import { useFlag } from '@rbx/flags';
import { Grid } from '@rbx/ui';
import { creatorAnalytics } from '@generated/flags/communities';
import { isIpLicensingEarningsEnabled } from '@generated/flags/contentLicensing';
import type { FormattedText } from '@modules/analytics-translations/types';
import withNamespaceSwitchedTranslation from '@modules/analytics-translations/withNamespaceSwitchedTranslation';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { StatusBanners } from '@modules/charts-generic/components/StatusBanner';
import { analyticsAnalyticsHomeNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import { AnalyticsPageTitle } from '@modules/charts-generic/layout/AnalyticsPageTitle';
import { AnalyticsHomeTab } from '@modules/clients/analytics';
import GeneralBreakglassBanner, {
  useIsGeneralBreakglassBannerOn,
} from '@modules/experience-analytics-shared/components/Banners/GeneralBreakglassBanner';
import MonetizationBreakglassBanner, {
  useIsMonetizationBreakglassBannerOn,
} from '@modules/experience-analytics-shared/components/Banners/MonetizationBreakglassBanner';
import { BannerCustomTarget } from '@modules/experience-analytics-shared/constants/statusConfig';
import { useAnalyticsHomeClient } from '@modules/experience-analytics-shared/context/AnalyticsHomeClientProvider';
import useOwner from '@modules/experience-analytics-shared/context/useOwner';
import useApiRequest from '@modules/experience-analytics-shared/hooks/useApiRequest';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import { useAnalyticsBannerConfiguration } from '@modules/experience-analytics-shared/hooks/useStatusConfiguration';
import AnalyticsHomePageLayout from '@modules/experience-analytics-shared/layout/AnalyticsHomePageLayout';
import { logTabLoad } from '@modules/experience-analytics-shared/logging/experienceAnalyticsUnifiedLogger';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentGroup } from '@modules/providers/groups/GroupsProvider';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import MigratedAvatarTabContent from './AvatarTab/MigratedAvatarTabContent';
import CommunityAnalyticsTabContent from './CommunityTab/CommunityAnalyticsTabContent';
import ExperiencesTabContentContainer from './ExperienceTab/ExperiencesTabContentContainer';
import IpLicensingTabContent from './IpLicensingTab/IpLicensingTabContent';
import ShareLinksTabContent from './ShareLinksTab/ShareLinksTabContent';
import StoreTabContent from './StoreTab/StoreTabContent';

type typeTabs = {
  key: string;
  label: FormattedText;
  content: React.JSX.Element;
};
const analyticsHomeBannerTargets = [BannerCustomTarget.AnalyticOverviews];
const missingGroupFlagContext = { groupId: 0 };

const AnalyticsHomePageContent: FunctionComponent = () => {
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const { translate, tPendingTranslation } = useRAQIV2TranslationDependencies();
  const analyticsHomeApiClient = useAnalyticsHomeClient();
  const owner = useOwner();
  const isGeneralBreakglassBannerOn = useIsGeneralBreakglassBannerOn();
  const isMonetizationBreakglassBannerOn = useIsMonetizationBreakglassBannerOn();
  const { data: activeBanners } = useAnalyticsBannerConfiguration(analyticsHomeBannerTargets);
  const { isFetched: isSettingsFetched } = useSettings();
  const currentGroup = useCurrentGroup();

  const fetchTabOrder = useCallback(async () => {
    if (!owner.isFetched) {
      return null;
    }
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
    return <MigratedAvatarTabContent />;
  }, [isSettingsFetched]);

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

  const ipLicensingTab = useMemo(
    () => ({
      key: 'IpLicensing',
      label: tPendingTranslation(
        'Licenses',
        'Tab label for the IP licensing earnings page',
        translationKey('Heading.Licenses', TranslationNamespace.Analytics),
      ),
      content: <IpLicensingTabContent />,
    }),
    [tPendingTranslation],
  );

  const communitiesTab = useMemo(
    () => ({
      key: 'Communities',
      label: translate(translationKey('Heading.Communities', TranslationNamespace.Community)),
      content: <CommunityAnalyticsTabContent />,
    }),
    [translate],
  );

  const { ready: isCommunityFlagReady, value: isCreatorAnalyticsEnabled } = useFlag(
    creatorAnalytics,
    currentGroup ? { groupId: currentGroup.id } : missingGroupFlagContext,
  );
  const showCommunitiesTab = Boolean(
    currentGroup && isCommunityFlagReady && isCreatorAnalyticsEnabled,
  );

  const { ready: isIpLicensingFlagReady, value: isIpLicensingEnabled } = useFlag(
    isIpLicensingEarningsEnabled,
  );
  const showIpLicensingTab = isIpLicensingFlagReady && isIpLicensingEnabled;

  const orderedTabs = useMemo(() => {
    if (!tabOrder?.homeTabOrders || isResponseFailed) {
      const tabs: typeTabs[] = [experiencesTab, avatarTab];
      tabs.push(storeTab);

      const experienceIndex = tabs.findIndex((item) => item.key === AnalyticsHomeTab.Experience);
      if (experienceIndex !== -1) {
        tabs.splice(experienceIndex + 1, 0, shareLinksTab);
      }

      if (showCommunitiesTab) {
        tabs.push(communitiesTab);
      }

      if (showIpLicensingTab) {
        tabs.push(ipLicensingTab);
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
          throw new Error(`Unhandled tab type ${String(exhaustiveCheck)}`);
        }
      }
    });
    tabs.push(storeTab);

    const experienceIndex = tabs.findIndex((item) => item.key === AnalyticsHomeTab.Experience);
    if (experienceIndex !== -1) {
      tabs.splice(experienceIndex + 1, 0, shareLinksTab);
    }

    if (showCommunitiesTab) {
      tabs.push(communitiesTab);
    }

    if (showIpLicensingTab) {
      tabs.push(ipLicensingTab);
    }

    return tabs;
  }, [
    tabOrder,
    isResponseFailed,
    experiencesTab,
    avatarTab,
    storeTab,
    shareLinksTab,
    showCommunitiesTab,
    communitiesTab,
    showIpLicensingTab,
    ipLicensingTab,
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
  TranslationNamespace.Community,
]);
