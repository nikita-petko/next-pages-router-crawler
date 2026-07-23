import type { NextLayoutPage } from 'next';
import RecommendationServiceCreateServicePageContainer from '@modules/creations/recommendationService/RecommendationServiceCreateServicePageContainer';
import getAnalyticsPageLayout from '@modules/experience-analytics-shared/pages/getUniverseAnalyticsPageLayout';

const RecommendationServiceCreatePage: NextLayoutPage = () => {
  return <RecommendationServiceCreateServicePageContainer />;
};

RecommendationServiceCreatePage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { noNavigationItem: true });
RecommendationServiceCreatePage.loggerConfig = { rosId: RosTeams.CollaborativeTools };

export default RecommendationServiceCreatePage;
