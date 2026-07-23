import type { NextLayoutPage } from 'next';
import { analyticsPerformanceNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import getAnalyticsPageLayout from '@modules/experience-analytics-shared/pages/getUniverseAnalyticsPageLayout';
import PerformancePageRAQIContent from '@modules/experience-monitoring/pages/PerformancePageV2/PerformancePageContentContainer';

const PerformanceAnalyticsPage: NextLayoutPage = () => {
  return <PerformancePageRAQIContent />;
};

PerformanceAnalyticsPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { navigationItem: analyticsPerformanceNavigationItem });
PerformanceAnalyticsPage.loggerConfig = { rosId: RosTeams.Analytics };

export default PerformanceAnalyticsPage;
