import { useEffect } from 'react';
import type { NextLayoutPage } from 'next';
import { useRouter } from 'next/router';
import { useFlag } from '@rbx/flags';
import { isJourneyEventsEnabled as isJourneysEnabledFlag } from '@generated/flags/creatorAnalytics';
import { analyticsRecommendedEventsJourneyNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import getAnalyticsPageLayout from '@modules/experience-analytics-shared/pages/getUniverseAnalyticsPageLayout';
import JourneysHomePageContent from '@modules/experience-analytics/pages/RecommendedEvents/Journeys/JourneysHomePageContent';
import { PageLoading } from '@modules/miscellaneous/components';

const AnalyticsJourneysPage: NextLayoutPage = () => {
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

  return <JourneysHomePageContent />;
};

AnalyticsJourneysPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, {
    navigationItem: analyticsRecommendedEventsJourneyNavigationItem,
  });
AnalyticsJourneysPage.loggerConfig = { rosId: RosTeams.Analytics };

export default AnalyticsJourneysPage;
