import React from 'react';
import type { NextLayoutPage } from 'next';
import { analyticsRecommendedEventsEconomyNavigationItem } from '@modules/charts-generic';
import { getAnalyticsPageLayout } from '@modules/experience-analytics-shared';
import EconomyPage from '@modules/experience-analytics/pages/RecommendedEvents/Economy/EconomyPageContentContainer';

const AnalyticsEconomyPage: NextLayoutPage = () => {
  return <EconomyPage />;
};

AnalyticsEconomyPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { navigationItem: analyticsRecommendedEventsEconomyNavigationItem });

export default AnalyticsEconomyPage;
