import type { NextLayoutPage } from 'next';
import { analyticsConfigsNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import getAnalyticsPageLayout from '@modules/experience-analytics-shared/pages/getUniverseAnalyticsPageLayout';
import ConfigCreationPage from '@modules/remote-configs/ConfigCreationPage';

const ConfigCreate: NextLayoutPage = () => {
  return <ConfigCreationPage />;
};

ConfigCreate.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, {
    navigationItem: analyticsConfigsNavigationItem,
    omitPageTitle: true,
  });
ConfigCreate.loggerConfig = { rosId: RosTeams.Analytics };

export default ConfigCreate;
