import type { NextLayoutPage } from 'next';
import { analyticsRecommendedEventsEconomyNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import getAnalyticsPageLayout from '@modules/experience-analytics-shared/pages/getUniverseAnalyticsPageLayout';
import EconomyPage from '@modules/experience-analytics/pages/RecommendedEvents/Economy/EconomyPageContentContainer';

const AnalyticsEconomyPage: NextLayoutPage = () => {
  return <EconomyPage />;
};

AnalyticsEconomyPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { navigationItem: analyticsRecommendedEventsEconomyNavigationItem });
AnalyticsEconomyPage.loggerConfig = { rosId: RosTeams.Analytics };

export default AnalyticsEconomyPage;
