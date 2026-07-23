import type { NextLayoutPage } from 'next';
import { analyticsConfigsHistoryNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import getAnalyticsPageLayout from '@modules/experience-analytics-shared/pages/getUniverseAnalyticsPageLayout';
import HistoryPageContainer from '@modules/remote-configs/HistoryPage';

const HistoryPage: NextLayoutPage = () => {
  return <HistoryPageContainer />;
};

HistoryPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { navigationItem: analyticsConfigsHistoryNavigationItem });
HistoryPage.loggerConfig = { rosId: RosTeams.Analytics };

export default HistoryPage;
