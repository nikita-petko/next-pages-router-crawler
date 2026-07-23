import type { FunctionComponent } from 'react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { captureException } from '@sentry/nextjs';
import { useRobloxAuthentication } from '@rbx/auth';
import { GenericCreatorSettingType } from '@rbx/client-creator-settings/v1';
import KnowledgeFeed from '@rbx/knowledge-feed';
import { useMediaQuery } from '@rbx/ui';
import AudienceReachGrowthOpportunitiesBanner from '@modules/audience-reach/components/AudienceReachGrowthOpportunitiesBanner';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import useStarterPlace from '@modules/landing/sections/hooks/useStarterPlace';
import {
  useCreateOrUpdateGenericCreatorSettings,
  useGetGenericCreatorSetting,
} from '@modules/react-query/creatorSettings';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import useShowOpportunities from '../hooks/useShowOpportunities';
import { useCreator } from '../providers/CreatorProvider';
import { ExperienceProvider } from '../providers/ExperienceProvider';
import { getDevForumAnnouncements } from '../utils/apiUtils';
import type { TDevForumAnnouncement } from '../utils/apiUtils';
import {
  captureHomepageImpression,
  captureHomepageView,
  EHomepageSection,
} from '../utils/eventUtils';
import Updates from './announcements/Updates';
import AvatarItemsWithAnalytics from './avatarItemsWithAnalytics/AvatarItemsWithAnalytics';
import BannerContainer from './banners/BannerContainer';
import BeginnerTools from './beginnerTools/BeginnerTools';
const CommunityStories = dynamic(() => import('./communityStories/CommunityStories'), {
  ssr: false,
});
import ContextSwitcher from './ContextSwitcher';
import Experiences from './experiences/Experiences';
import useHomeLayoutStyles from './Home.styles';
import { HomeUnifiedAlertBanner } from './HomeUnifiedAlertBanner';
import NextSteps from './nextSteps/NextSteps';
import OnboardingContainer from './onboarding/OnboardingContainer';
import Opportunities from './opportunities/Opportunities';

const analyticsTimeWindowInDays = 7;

// localStorage key and TTL for the Updates panel collapsed state.
// When a user collapses the Updates panel, it stays collapsed for 72 hours
// before automatically reverting to the expanded state on next page load.
const UPDATES_COLLAPSED_KEY = 'creatorHub_updatesCollapsedAt';
const UPDATES_COLLAPSED_TTL_MS = 72 * 60 * 60 * 1000;
const KNOWLEDGE_FEED_SUPPORTED_ROBLOX_SITE_DOMAINS = [
  'roblox.com',
  'sitetest1.robloxlabs.com',
  'sitetest2.robloxlabs.com',
  'sitetest3.robloxlabs.com',
] as const;
type TKnowledgeFeedRobloxSiteDomain = (typeof KNOWLEDGE_FEED_SUPPORTED_ROBLOX_SITE_DOMAINS)[number];

const isKnowledgeFeedSupportedRobloxSiteDomain = (
  domain: string,
): domain is TKnowledgeFeedRobloxSiteDomain =>
  KNOWLEDGE_FEED_SUPPORTED_ROBLOX_SITE_DOMAINS.some(
    (supportedDomain) => supportedDomain === domain,
  );

const Home: FunctionComponent = () => {
  const { context } = useCreator();
  const { classes, cx } = useHomeLayoutStyles();
  const { isFetched: isFetchedUserAuthentication, user } = useRobloxAuthentication();
  const isMd = useMediaQuery((theme) => theme.breakpoints.down('Large'));
  const isSingleColumn = useMediaQuery((theme) => theme.breakpoints.down('Large'));
  const [announcements, setAnnouncements] = useState<TDevForumAnnouncement[] | null>(null);
  const userId = user?.id;
  const [shouldResetOnboardingBanner, setShouldResetOnboardingBanner] = useState(false);
  const [isUpdatesCollapsed, setIsUpdatesCollapsed] = useState(() => {
    try {
      const stored = localStorage.getItem(UPDATES_COLLAPSED_KEY);
      if (!stored) {
        return false;
      }
      const collapsedAt = Number(stored);
      if (Number.isNaN(collapsedAt)) {
        return false;
      }
      return Date.now() - collapsedAt < UPDATES_COLLAPSED_TTL_MS;
    } catch {
      return false;
    }
  });
  const { settings: clientSettings, isFetched: isFetchedClientSettings } = useSettings();
  const { mutateAsync: updateSettings } = useCreateOrUpdateGenericCreatorSettings();
  const { data: currentLastViewedDate, isFetched: isFetchedLastViewedDate } =
    useGetGenericCreatorSetting(userId, GenericCreatorSettingType.HubHomeLastViewedDate);

  const {
    enableStarterPlace,
    starterPlaceTemplateId,
    isFetched: isFetchedStarterPlaceCreation,
  } = useStarterPlace();
  const { show: showOpportunities } = useShowOpportunities();
  const knowledgeFeedRobloxSiteDomain =
    process.env.buildTarget !== 'luobu' &&
    isKnowledgeFeedSupportedRobloxSiteDomain(process.env.robloxSiteDomain)
      ? process.env.robloxSiteDomain
      : null;

  const shouldProceedWithUpdateSettingsLastViewedDate = useMemo(
    () =>
      isFetchedUserAuthentication &&
      userId &&
      isFetchedClientSettings &&
      isFetchedLastViewedDate &&
      isFetchedStarterPlaceCreation,
    [
      isFetchedUserAuthentication,
      userId,
      isFetchedClientSettings,
      isFetchedLastViewedDate,
      isFetchedStarterPlaceCreation,
    ],
  );
  const homePageLayoutType = 'homePageLayoutNewWithAlert';
  const homeLayoutClassName = cx(
    classes.homeLayout,
    !isSingleColumn && isUpdatesCollapsed && classes.homeLayoutCollapsed,
  );
  const updatesContainerClassName = cx(
    classes.updatesContainer,
    isUpdatesCollapsed && classes.updatesContainerCollapsed,
  );

  useEffect(() => {
    captureHomepageImpression();
  }, []);

  const getAndUpdateSettingsLastViewedDate = useCallback(async () => {
    if (!shouldProceedWithUpdateSettingsLastViewedDate) {
      return;
    }

    if (enableStarterPlace && currentLastViewedDate) {
      const lastViewedDate = new Date(currentLastViewedDate);
      const experimentStartDate = new Date(clientSettings.enableYourPlaceCreationExperimentDate);

      // Only compare if both dates are valid
      if (!Number.isNaN(lastViewedDate.getTime()) && !Number.isNaN(experimentStartDate.getTime())) {
        if (lastViewedDate < experimentStartDate) {
          setShouldResetOnboardingBanner(true);
        }
      }
    }
    try {
      await updateSettings({
        userId,
        setting: GenericCreatorSettingType.HubHomeLastViewedDate,
        settingValue: new Date().toISOString(),
      });
    } catch (error) {
      if (error instanceof Error) {
        error.message = `Creator Hub Home: Error updating last viewed date: ${error.message}`;
      }
      captureException(error);
    }
  }, [
    currentLastViewedDate,
    setShouldResetOnboardingBanner,
    clientSettings,
    shouldProceedWithUpdateSettingsLastViewedDate,
    enableStarterPlace,
    updateSettings,
    userId,
  ]);

  useEffect(() => {
    captureHomepageView(homePageLayoutType, EHomepageSection.HomePageAnnouncements);
  }, [homePageLayoutType]);

  useEffect(() => {
    const fetchAnnouncementsAndUpdateDate = async () => {
      if (!isFetchedUserAuthentication || !userId || !isFetchedLastViewedDate) {
        return;
      }
      try {
        const lastViewedDate = currentLastViewedDate ?? '';
        const { topics } = await getDevForumAnnouncements(lastViewedDate);
        setAnnouncements(topics);
      } catch (error) {
        captureException(`Creator Hub Home: Error fetching announcements: ${String(error)}`);
        setAnnouncements([]);
      } finally {
        await getAndUpdateSettingsLastViewedDate();
      }
    };
    void fetchAnnouncementsAndUpdateDate();
  }, [
    currentLastViewedDate,
    getAndUpdateSettingsLastViewedDate,
    isFetchedLastViewedDate,
    isFetchedUserAuthentication,
    userId,
  ]);

  return (
    <>
      {!isMd ? null : <ContextSwitcher />}
      <ExperienceProvider context={context} window={analyticsTimeWindowInDays}>
        <div className={homeLayoutClassName}>
          <div className={classes.mainColumn}>
            <OnboardingContainer
              shouldResetOnboardingBanner={shouldResetOnboardingBanner}
              starterPlaceTemplateId={starterPlaceTemplateId}
              isFetchedStarterPlaceCreation={isFetchedStarterPlaceCreation}
              isCreatePlaceEnabled={enableStarterPlace}
            />
            <HomeUnifiedAlertBanner />
            <AudienceReachGrowthOpportunitiesBanner />
            <BannerContainer />
            {isSingleColumn && (
              <Updates announcements={announcements} isSingleColumn enableUpdatesNewLayoutV1 />
            )}
            <Experiences />
            <AvatarItemsWithAnalytics />
            {knowledgeFeedRobloxSiteDomain && (
              <div className={classes.knowledgeFeedWrapper}>
                <KnowledgeFeed
                  robloxSiteDomain={knowledgeFeedRobloxSiteDomain}
                  surfaceType='CreatorHub'
                  unifiedLoggerClient={unifiedLoggerClient}
                  headerKey='Heading.Learn'
                />
              </div>
            )}
            {showOpportunities && <Opportunities />}
            <NextSteps />
            <BeginnerTools />
            <CommunityStories />
          </div>
          {!isSingleColumn && (
            <div className={updatesContainerClassName}>
              <Updates
                announcements={announcements}
                isSingleColumn={isSingleColumn}
                enableUpdatesNewLayoutV1
                isCollapsed={isUpdatesCollapsed}
                onCollapse={() => {
                  setIsUpdatesCollapsed(true);
                  try {
                    localStorage.setItem(UPDATES_COLLAPSED_KEY, String(Date.now()));
                  } catch {
                    /* noop */
                  }
                }}
                onExpand={() => {
                  setIsUpdatesCollapsed(false);
                  try {
                    localStorage.removeItem(UPDATES_COLLAPSED_KEY);
                  } catch {
                    /* noop */
                  }
                }}
              />
            </div>
          )}
        </div>
      </ExperienceProvider>
    </>
  );
};

export default Home;
