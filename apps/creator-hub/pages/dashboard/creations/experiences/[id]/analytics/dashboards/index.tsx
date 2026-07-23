import type { NextLayoutPage } from 'next';
import { analyticsCustomDashboardsManageNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import getAnalyticsPageLayout from '@modules/experience-analytics-shared/pages/getUniverseAnalyticsPageLayout';
import ManageAllDashboardsPage from '@modules/experience-analytics/custom-dashboards/pages/manage/ManageAllDashboardsPage';

/**
 * Next.js route entry for the Custom Dashboards manage page.
 * Thin shell — delegates everything to `ManageAllDashboardsPage` under
 * the experience-analytics/custom-dashboards module.
 *
 * The feature-flag gate lives inside `CustomDashboardsShell` (mounted
 * by the page component itself), not at this route level, so the
 * Next.js layout chrome (page title, breadcrumb) renders consistently
 * even when the flag is off and the page body is empty.
 */
const CustomDashboardsManagePage: NextLayoutPage = () => {
  return <ManageAllDashboardsPage />;
};

CustomDashboardsManagePage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, {
    navigationItem: analyticsCustomDashboardsManageNavigationItem,
    omitPageTitle: true,
  });
CustomDashboardsManagePage.loggerConfig = { rosId: RosTeams.Analytics };

export default CustomDashboardsManagePage;
