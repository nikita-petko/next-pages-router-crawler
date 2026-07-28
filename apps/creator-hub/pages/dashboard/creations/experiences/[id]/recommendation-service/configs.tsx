import type { NextLayoutPage } from 'next';
import RecommendationServiceLandingPageContainer from '@modules/creations/recommendationService/RecommendationServiceLandingPageContainer';
import getAnalyticsPageLayout from '@modules/experience-analytics-shared/pages/getUniverseAnalyticsPageLayout';

const RecommendationServicesConfigsPage: NextLayoutPage = () => {
  return <RecommendationServiceLandingPageContainer initialTab='configuration' />;
};

RecommendationServicesConfigsPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { noNavigationItem: true });
RecommendationServicesConfigsPage.loggerConfig = { rosId: RosTeams.CollaborativeTools };

export default RecommendationServicesConfigsPage;
