import type { NextLayoutPage } from 'next';
import { analyticsRecommendedEventsJourneyEditNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import getAnalyticsPageLayout from '@modules/experience-analytics-shared/pages/getUniverseAnalyticsPageLayout';
import JourneysConfigPageTitle from '@modules/experience-analytics/pages/RecommendedEvents/JourneysCreate/components/JourneysConfigPageTitle';
import JourneysEditPage from '@modules/experience-analytics/pages/RecommendedEvents/JourneysCreate/JourneysEditPage';

const AnalyticsJourneysEditPage: NextLayoutPage = () => {
  return <JourneysEditPage />;
};

AnalyticsJourneysEditPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, {
    navigationItem: analyticsRecommendedEventsJourneyEditNavigationItem,
    titleOverride: <JourneysConfigPageTitle />,
  });
AnalyticsJourneysEditPage.loggerConfig = { rosId: RosTeams.Analytics };

export default AnalyticsJourneysEditPage;
