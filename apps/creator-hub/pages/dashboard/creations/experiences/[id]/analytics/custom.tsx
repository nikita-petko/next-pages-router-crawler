import React from 'react';
import type { NextLayoutPage } from 'next';
import { analyticsCustomEventsNavigationItem } from '@modules/charts-generic';
import { getAnalyticsPageLayout } from '@modules/experience-analytics-shared';
import CustomEventsPage from '@modules/experience-analytics/pages/RecommendedEvents/CustomEvents/CustomEventsPageContentContainer';

const AnalyticsCustomEventsPage: NextLayoutPage = () => {
  return <CustomEventsPage />;
};

AnalyticsCustomEventsPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { navigationItem: analyticsCustomEventsNavigationItem });

export default AnalyticsCustomEventsPage;
