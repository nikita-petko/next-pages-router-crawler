import { useEffect } from 'react';
import type { NextLayoutPage } from 'next';
import { useRouter } from 'next/router';
import { useFlag } from '@rbx/flags';
import { isJourneyEventsEnabled as isJourneysEnabledFlag } from '@generated/flags/creatorAnalytics';
import { analyticsRecommendedEventsJourneyCreateNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import getAnalyticsPageLayout from '@modules/experience-analytics-shared/pages/getUniverseAnalyticsPageLayout';
import JourneysConfigPageTitle from '@modules/experience-analytics/pages/RecommendedEvents/JourneysCreate/JourneysConfigPageTitle';
import JourneysCreatePage from '@modules/experience-analytics/pages/RecommendedEvents/JourneysCreate/JourneysCreatePage';
import { PageLoading } from '@modules/miscellaneous/components';

const AnalyticsJourneysCreatePage: NextLayoutPage = () => {
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

  return <JourneysCreatePage />;
};

AnalyticsJourneysCreatePage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, {
    navigationItem: analyticsRecommendedEventsJourneyCreateNavigationItem,
    titleOverride: <JourneysConfigPageTitle />,
  });
AnalyticsJourneysCreatePage.loggerConfig = { rosId: RosTeams.Analytics };

export default AnalyticsJourneysCreatePage;
