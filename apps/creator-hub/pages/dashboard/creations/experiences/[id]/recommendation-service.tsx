import type { NextLayoutPage } from 'next';
import RecommendationServiceLandingPageContainer from '@modules/creations/recommendationService/RecommendationServiceLandingPageContainer';
import getAnalyticsPageLayout from '@modules/experience-analytics-shared/pages/getUniverseAnalyticsPageLayout';

const RecommendationServicePage: NextLayoutPage = () => {
  return <RecommendationServiceLandingPageContainer />;
};

RecommendationServicePage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { noNavigationItem: true });
RecommendationServicePage.loggerConfig = { rosId: RosTeams.CollaborativeTools };

export default RecommendationServicePage;
