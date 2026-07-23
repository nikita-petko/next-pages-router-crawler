import type { NextLayoutPage } from 'next';
import { analyticsRecommendedEventsFunnelsNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import getAnalyticsPageLayout from '@modules/experience-analytics-shared/pages/getUniverseAnalyticsPageLayout';
import FunnelsPage from '@modules/experience-analytics/pages/RecommendedEvents/Funnels/FunnelsPageContentContainer';

const AnalyticsFunnelsPage: NextLayoutPage = () => {
  return <FunnelsPage />;
};

AnalyticsFunnelsPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { navigationItem: analyticsRecommendedEventsFunnelsNavigationItem });
AnalyticsFunnelsPage.loggerConfig = { rosId: RosTeams.Analytics };

export default AnalyticsFunnelsPage;
