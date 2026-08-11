import type { NextLayoutPage } from 'next';
import { analyticsRecommendedEventsJourneyNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import getAnalyticsPageLayout from '@modules/experience-analytics-shared/pages/getUniverseAnalyticsPageLayout';
import JourneysHomePageContent from '@modules/experience-analytics/pages/RecommendedEvents/Journeys/JourneysHomePageContent';

const AnalyticsJourneysPage: NextLayoutPage = () => {
  return <JourneysHomePageContent />;
};

AnalyticsJourneysPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, {
    navigationItem: analyticsRecommendedEventsJourneyNavigationItem,
  });
AnalyticsJourneysPage.loggerConfig = { rosId: RosTeams.Analytics };

export default AnalyticsJourneysPage;
