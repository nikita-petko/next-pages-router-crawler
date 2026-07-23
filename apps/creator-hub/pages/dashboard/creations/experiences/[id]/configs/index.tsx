import type { NextLayoutPage } from 'next';
import { analyticsConfigsNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import getAnalyticsPageLayout from '@modules/experience-analytics-shared/pages/getUniverseAnalyticsPageLayout';
import RemoteConfigsPage from '@modules/remote-configs/CreatorConfigsHubPage';

const ConfigsPage: NextLayoutPage = () => {
  return <RemoteConfigsPage />;
};

ConfigsPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { navigationItem: analyticsConfigsNavigationItem });
ConfigsPage.loggerConfig = { rosId: RosTeams.Analytics };

export default ConfigsPage;
