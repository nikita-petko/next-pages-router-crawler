import type { NextLayoutPage } from 'next';
import { analyticsAgentNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import getAnalyticsPageLayout from '@modules/experience-analytics-shared/pages/getUniverseAnalyticsPageLayout';
import ExperienceAnalyticsAIChatPageContainer from '@modules/experience-analytics/pages/AIChat/AIChatPageContainer';

const AnalyticsAgent: NextLayoutPage = () => {
  return <ExperienceAnalyticsAIChatPageContainer />;
};

AnalyticsAgent.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, {
    navigationItem: analyticsAgentNavigationItem,
    omitPageTitle: true,
  });
AnalyticsAgent.loggerConfig = { rosId: RosTeams.Analytics };

export default AnalyticsAgent;
