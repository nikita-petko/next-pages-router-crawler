import type { NextLayoutPage } from 'next';
import { analyticsAssistantNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import getAnalyticsPageLayout from '@modules/experience-analytics-shared/pages/getUniverseAnalyticsPageLayout';
import AssistantPage from '@modules/experience-analytics/pages/Assistant/AssistantPageContainer';

const AnalyticsExploreMode: NextLayoutPage = () => {
  return <AssistantPage />;
};

AnalyticsExploreMode.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, {
    navigationItem: analyticsAssistantNavigationItem,
    omitPageTitle: true,
  });
AnalyticsExploreMode.loggerConfig = { rosId: RosTeams.Analytics };

export default AnalyticsExploreMode;
