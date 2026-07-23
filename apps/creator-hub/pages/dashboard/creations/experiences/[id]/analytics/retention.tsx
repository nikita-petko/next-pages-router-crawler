import type { NextLayoutPage } from 'next';
import { analyticsRetentionNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import getAnalyticsPageLayout from '@modules/experience-analytics-shared/pages/getUniverseAnalyticsPageLayout';
import ExperienceAnalyticsRetentionPage from '@modules/experience-analytics/pages/RetentionPage/RetentionPage';

const RetentionAnalyticsPage: NextLayoutPage = () => {
  return <ExperienceAnalyticsRetentionPage />;
};

RetentionAnalyticsPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { navigationItem: analyticsRetentionNavigationItem });
RetentionAnalyticsPage.loggerConfig = { rosId: RosTeams.Analytics };

export default RetentionAnalyticsPage;
