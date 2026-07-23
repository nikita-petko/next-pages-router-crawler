import type { NextLayoutPage } from 'next';
import { analyticsAlertsNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import AlertConfigurationsPage from '@modules/experience-alerts/pages/AlertConfigurationsPage';
import getAnalyticsPageLayout from '@modules/experience-analytics-shared/pages/getUniverseAnalyticsPageLayout';

const AlertsPage: NextLayoutPage = () => {
  return <AlertConfigurationsPage />;
};

AlertsPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { navigationItem: analyticsAlertsNavigationItem });
AlertsPage.loggerConfig = { rosId: RosTeams.Analytics };

export default AlertsPage;
