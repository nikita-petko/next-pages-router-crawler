import React from 'react';
import type { NextLayoutPage } from 'next';
import { getAnalyticsPageLayout } from '@modules/experience-analytics-shared';
import { analyticsRecommendedEventsFunnelsNavigationItem } from '@modules/charts-generic';
import FunnelsPage from '@modules/experience-analytics/pages/RecommendedEvents/Funnels/FunnelsPageContentContainer';

const AnalyticsFunnelsPage: NextLayoutPage = () => {
  return <FunnelsPage />;
};

AnalyticsFunnelsPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { navigationItem: analyticsRecommendedEventsFunnelsNavigationItem });

export default AnalyticsFunnelsPage;
