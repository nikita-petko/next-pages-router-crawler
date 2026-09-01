import type { NextLayoutPage } from 'next';
import { analyticsRecommendedEventsJourneyViewNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import RecommendedEventsLiveStatsClientProvider from '@modules/experience-analytics-shared/context/RecommendedEventsLiveStatsClientProvider';
import getAnalyticsPageLayout from '@modules/experience-analytics-shared/pages/getUniverseAnalyticsPageLayout';
import JourneysPageContent from '@modules/experience-analytics/pages/RecommendedEvents/Journeys/JourneysPageContent';
import { JourneysViewPageTitle } from '@modules/experience-analytics/pages/RecommendedEvents/Journeys/JourneysPageTitle';

const AnalyticsJourneyViewPage: NextLayoutPage = () => {
  return (
    <RecommendedEventsLiveStatsClientProvider>
      <JourneysPageContent />
    </RecommendedEventsLiveStatsClientProvider>
  );
};

AnalyticsJourneyViewPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, {
    navigationItem: analyticsRecommendedEventsJourneyViewNavigationItem,
    titleOverride: <JourneysViewPageTitle />,
  });
AnalyticsJourneyViewPage.loggerConfig = { rosId: RosTeams.Analytics };

export default AnalyticsJourneyViewPage;
