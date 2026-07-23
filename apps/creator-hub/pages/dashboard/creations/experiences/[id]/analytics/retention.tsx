import React from 'react';
import type { NextLayoutPage } from 'next';
import { getAnalyticsPageLayout } from '@modules/experience-analytics-shared';
import { analyticsRetentionNavigationItem } from '@modules/charts-generic';
import ExperienceAnalyticsRetentionPage from '@modules/experience-analytics/pages/RetentionPage/RetentionPage';

const RetentionAnalyticsPage: NextLayoutPage = () => {
  return <ExperienceAnalyticsRetentionPage />;
};

RetentionAnalyticsPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { navigationItem: analyticsRetentionNavigationItem });

export default RetentionAnalyticsPage;
