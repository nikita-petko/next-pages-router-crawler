import React from 'react';
import type { NextLayoutPage } from 'next';
import { getAnalyticsPageLayout } from '@modules/experience-analytics-shared';
// eslint-disable-next-line no-restricted-imports -- Avoid circular dependency, import directly instead of from barrel file
import RecommendationServiceLandingPageContainer from '@modules/creations/recommendationService/RecommendationServiceLandingPageContainer';

const RecommendationServicesConfigsPage: NextLayoutPage = () => {
  return <RecommendationServiceLandingPageContainer initialTab='configuration' />;
};

RecommendationServicesConfigsPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { noNavigationItem: true });

export default RecommendationServicesConfigsPage;
