import type { NextLayoutPage } from 'next';
import { analyticsEngagementNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import getAnalyticsPageLayout from '@modules/experience-analytics-shared/pages/getUniverseAnalyticsPageLayout';
import ExperienceAnalyticsEngagementPage from '@modules/experience-analytics/pages/EngagementPageV2/EngagementPageRAQIV2';

const EngagementAnalyticsPage: NextLayoutPage = () => {
  return <ExperienceAnalyticsEngagementPage />;
};

EngagementAnalyticsPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { navigationItem: analyticsEngagementNavigationItem });
EngagementAnalyticsPage.loggerConfig = { rosId: RosTeams.Analytics };

export default EngagementAnalyticsPage;
