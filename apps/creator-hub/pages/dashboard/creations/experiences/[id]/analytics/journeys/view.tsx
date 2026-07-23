import { useEffect } from 'react';
import type { NextLayoutPage } from 'next';
import { useRouter } from 'next/router';
import { useFlag } from '@rbx/flags';
import { isJourneyEventsEnabled as isJourneysEnabledFlag } from '@generated/flags/creatorAnalytics';
import { analyticsRecommendedEventsJourneyViewNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import getAnalyticsPageLayout from '@modules/experience-analytics-shared/pages/getUniverseAnalyticsPageLayout';
import JourneysPageContent from '@modules/experience-analytics/pages/RecommendedEvents/Journeys/JourneysPageContent';
import JourneysPageTitle from '@modules/experience-analytics/pages/RecommendedEvents/Journeys/JourneysPageTitle';
import { PageLoading } from '@modules/miscellaneous/components';

const AnalyticsJourneyViewPage: NextLayoutPage = () => {
  const router = useRouter();
  const { ready, value: isJourneysEnabled } = useFlag(isJourneysEnabledFlag);

  useEffect(() => {
    if (ready && !isJourneysEnabled) {
      void router.replace('/404');
    }
  }, [ready, isJourneysEnabled, router]);

  if (!ready) {
    return <PageLoading />;
  }
  if (!isJourneysEnabled) {
    return null;
  }

  return <JourneysPageContent />;
};

AnalyticsJourneyViewPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, {
    navigationItem: analyticsRecommendedEventsJourneyViewNavigationItem,
    titleOverride: <JourneysPageTitle />,
  });
AnalyticsJourneyViewPage.loggerConfig = { rosId: RosTeams.Analytics };

export default AnalyticsJourneyViewPage;
