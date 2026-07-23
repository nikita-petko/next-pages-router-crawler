import type { NextLayoutPage } from 'next';
import { analyticsAnalyticsHomeNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import getAnalyticsPageLayout from '@modules/experience-analytics-shared/pages/getUniverseAnalyticsPageLayout';
import ExperienceAnalyticsLegacyOverviewPage from '@modules/experience-analytics/pages/LegacyOverviewPage';

const AnalyticsOverviewPage: NextLayoutPage = () => {
  return <ExperienceAnalyticsLegacyOverviewPage />;
};

AnalyticsOverviewPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { navigationItem: analyticsAnalyticsHomeNavigationItem });
AnalyticsOverviewPage.loggerConfig = { rosId: RosTeams.Analytics };

export default AnalyticsOverviewPage;
