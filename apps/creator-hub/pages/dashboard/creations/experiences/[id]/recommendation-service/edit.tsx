import React from 'react';
import type { NextLayoutPage } from 'next';
import { getAnalyticsPageLayout } from '@modules/experience-analytics-shared';
// eslint-disable-next-line no-restricted-imports -- Avoid circular dependency, import directly instead of from barrel file
import RecommendationServiceEditServicePageContainer from '@modules/creations/recommendationService/RecommendationServiceEditServicePageContainer';

const RecommendationServiceEditPage: NextLayoutPage = () => {
  return <RecommendationServiceEditServicePageContainer />;
};

RecommendationServiceEditPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { noNavigationItem: true });

export default RecommendationServiceEditPage;
