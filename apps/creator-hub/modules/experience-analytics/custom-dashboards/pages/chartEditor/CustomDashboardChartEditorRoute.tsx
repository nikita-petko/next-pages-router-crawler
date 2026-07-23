import type { NextLayoutPage } from 'next';
import { analyticsCustomDashboardsManageNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import getAnalyticsPageLayout from '@modules/experience-analytics-shared/pages/getUniverseAnalyticsPageLayout';
import ChartEditorPage from './ChartEditorPage';

const CustomDashboardChartEditorRoute: NextLayoutPage = () => {
  return <ChartEditorPage />;
};

CustomDashboardChartEditorRoute.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, {
    navigationItem: analyticsCustomDashboardsManageNavigationItem,
    omitPageTitle: true,
  });
CustomDashboardChartEditorRoute.loggerConfig = { rosId: RosTeams.Analytics };

export default CustomDashboardChartEditorRoute;
