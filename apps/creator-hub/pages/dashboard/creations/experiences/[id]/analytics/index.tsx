import React from 'react';
import type { NextLayoutPage } from 'next';
import { getAnalyticsPageLayout } from '@modules/experience-analytics-shared';
import ExperienceAnalyticsLegacyOverviewPage from '@modules/experience-analytics/pages/LegacyOverviewPage';
import { analyticsAnalyticsHomeNavigationItem } from '@modules/charts-generic';

const AnalyticsOverviewPage: NextLayoutPage = () => {
  return <ExperienceAnalyticsLegacyOverviewPage />;
};

AnalyticsOverviewPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { navigationItem: analyticsAnalyticsHomeNavigationItem });

export default AnalyticsOverviewPage;
