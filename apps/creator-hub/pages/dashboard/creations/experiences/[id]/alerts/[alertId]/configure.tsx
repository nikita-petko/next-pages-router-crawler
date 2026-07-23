import type { NextLayoutPage } from 'next';
import { analyticsAlertConfifurationNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import ConfigureAlertPage from '@modules/experience-alerts/pages/ConfigureAlertPage';
import getAnalyticsPageLayout from '@modules/experience-analytics-shared/pages/getUniverseAnalyticsPageLayout';

const ConfigureAlert: NextLayoutPage = () => {
  return <ConfigureAlertPage />;
};

ConfigureAlert.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { navigationItem: analyticsAlertConfifurationNavigationItem });
ConfigureAlert.loggerConfig = { rosId: RosTeams.Analytics };

export default ConfigureAlert;
