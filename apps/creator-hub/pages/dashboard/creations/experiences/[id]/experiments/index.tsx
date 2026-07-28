import type { NextLayoutPage } from 'next';
import { analyticsExperimentsNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import getAnalyticsPageLayout from '@modules/experience-analytics-shared/pages/getUniverseAnalyticsPageLayout';
import ExperimentsPage from '@modules/remote-configs/experimentation/pages/ExperimentsPage';

const Experiment: NextLayoutPage = () => {
  return <ExperimentsPage />;
};

Experiment.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { navigationItem: analyticsExperimentsNavigationItem });
Experiment.loggerConfig = { rosId: RosTeams.Analytics };

export default Experiment;
