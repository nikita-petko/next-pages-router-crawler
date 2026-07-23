import type { NextLayoutPage } from 'next';
import { analyticsGenerativeAINavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import GenerativeAIPageContainer from '@modules/creations/generativeAI/GenerativeAIPageContainer';
import getAnalyticsPageLayout from '@modules/experience-analytics-shared/pages/getUniverseAnalyticsPageLayout';

const GenerativeAIAnalyticsPage: NextLayoutPage = () => {
  return <GenerativeAIPageContainer />;
};

GenerativeAIAnalyticsPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { navigationItem: analyticsGenerativeAINavigationItem });
GenerativeAIAnalyticsPage.loggerConfig = { rosId: RosTeams.Analytics };

export default GenerativeAIAnalyticsPage;
