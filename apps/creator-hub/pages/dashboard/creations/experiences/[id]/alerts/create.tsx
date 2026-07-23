import type { NextLayoutPage } from 'next';
import { analyticsAlertCreationNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import CreateAlertPage from '@modules/experience-alerts/pages/CreateAlertPage';
import getAnalyticsPageLayout from '@modules/experience-analytics-shared/pages/getUniverseAnalyticsPageLayout';

const CreateAlert: NextLayoutPage = () => {
  return <CreateAlertPage />;
};

CreateAlert.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { navigationItem: analyticsAlertCreationNavigationItem });
CreateAlert.loggerConfig = { rosId: RosTeams.Analytics };

export default CreateAlert;
