import type { NextLayoutPage } from 'next';
import { analyticsRecommendedEventsJourneyNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import getAnalyticsPageLayout from '@modules/experience-analytics-shared/pages/getUniverseAnalyticsPageLayout';
import JourneysHomePageContent from '@modules/experience-analytics/pages/RecommendedEvents/Journeys/JourneysHomePageContent';
import { JourneysHomePageTitle } from '@modules/experience-analytics/pages/RecommendedEvents/Journeys/JourneysPageTitle';

const AnalyticsJourneysPage: NextLayoutPage = () => {
  return <JourneysHomePageContent />;
};

AnalyticsJourneysPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, {
    navigationItem: analyticsRecommendedEventsJourneyNavigationItem,
    titleOverride: <JourneysHomePageTitle />,
  });
AnalyticsJourneysPage.loggerConfig = { rosId: RosTeams.Analytics };

export default AnalyticsJourneysPage;
