import type { NextLayoutPage } from 'next';
import RecommendationServiceEditServicePageContainer from '@modules/creations/recommendationService/RecommendationServiceEditServicePageContainer';
import getAnalyticsPageLayout from '@modules/experience-analytics-shared/pages/getUniverseAnalyticsPageLayout';

const RecommendationServiceEditPage: NextLayoutPage = () => {
  return <RecommendationServiceEditServicePageContainer />;
};

RecommendationServiceEditPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { noNavigationItem: true });
RecommendationServiceEditPage.loggerConfig = { rosId: RosTeams.CollaborativeTools };

export default RecommendationServiceEditPage;
