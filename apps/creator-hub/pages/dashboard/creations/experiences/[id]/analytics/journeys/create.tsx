import type { NextLayoutPage } from 'next';
import { analyticsRecommendedEventsJourneyCreateNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import getAnalyticsPageLayout from '@modules/experience-analytics-shared/pages/getUniverseAnalyticsPageLayout';
import JourneysConfigPageTitle from '@modules/experience-analytics/pages/RecommendedEvents/JourneysCreate/components/JourneysConfigPageTitle';
import JourneysCreatePage from '@modules/experience-analytics/pages/RecommendedEvents/JourneysCreate/JourneysCreatePage';

const AnalyticsJourneysCreatePage: NextLayoutPage = () => {
  return <JourneysCreatePage />;
};

AnalyticsJourneysCreatePage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, {
    navigationItem: analyticsRecommendedEventsJourneyCreateNavigationItem,
    titleOverride: <JourneysConfigPageTitle />,
  });
AnalyticsJourneysCreatePage.loggerConfig = { rosId: RosTeams.Analytics };

export default AnalyticsJourneysCreatePage;
