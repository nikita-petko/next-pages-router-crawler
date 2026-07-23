import React from 'react';
import type { NextLayoutPage } from 'next';
import { getAnalyticsPageLayout } from '@modules/experience-analytics-shared';
import { analyticsEngagementNavigationItem } from '@modules/charts-generic';
import ExperienceAnalyticsEngagementPage from '@modules/experience-analytics/pages/EngagementPageV2/EngagementPageRAQIV2';

const EngagementAnalyticsPage: NextLayoutPage = () => {
  return <ExperienceAnalyticsEngagementPage />;
};

EngagementAnalyticsPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { navigationItem: analyticsEngagementNavigationItem });

export default EngagementAnalyticsPage;
