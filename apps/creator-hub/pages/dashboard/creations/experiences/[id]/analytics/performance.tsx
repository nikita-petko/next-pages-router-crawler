import React from 'react';
import type { NextLayoutPage } from 'next';
import { getAnalyticsPageLayout } from '@modules/experience-analytics-shared';
import { analyticsPerformanceNavigationItem } from '@modules/charts-generic';
import PerformancePageRAQIContent from '@modules/experience-monitoring/pages/PerformancePageV2/PerformancePageContentContainer';

const PerformanceAnalyticsPage: NextLayoutPage = () => {
  return <PerformancePageRAQIContent />;
};

PerformanceAnalyticsPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { navigationItem: analyticsPerformanceNavigationItem });

export default PerformanceAnalyticsPage;
