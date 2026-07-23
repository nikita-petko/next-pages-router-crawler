import type { NextLayoutPage } from 'next';
import { analyticsExperimentsCreateNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import getAnalyticsPageLayout from '@modules/experience-analytics-shared/pages/getUniverseAnalyticsPageLayout';
import ExperimentCreationPage from '@modules/remote-configs/experimentation/pages/ExperimentCreationPage';

const ExperimentsCreation: NextLayoutPage = () => {
  return <ExperimentCreationPage />;
};

ExperimentsCreation.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { navigationItem: analyticsExperimentsCreateNavigationItem });
ExperimentsCreation.loggerConfig = { rosId: RosTeams.Analytics };

export default ExperimentsCreation;
