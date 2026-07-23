import React from 'react';
import type { NextLayoutPage } from 'next';
import { getAnalyticsPageLayout } from '@modules/experience-analytics-shared';
// eslint-disable-next-line no-restricted-imports -- Avoid circular dependency, import directly instead of from barrel file
import RecommendationServiceCreateServicePageContainer from '@modules/creations/recommendationService/RecommendationServiceCreateServicePageContainer';

const RecommendationServiceCreatePage: NextLayoutPage = () => {
  return <RecommendationServiceCreateServicePageContainer />;
};

RecommendationServiceCreatePage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { noNavigationItem: true });

export default RecommendationServiceCreatePage;
