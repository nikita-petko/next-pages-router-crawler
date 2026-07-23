import React from 'react';
import type { NextLayoutPage } from 'next';
import { analyticsAssistantNavigationItem } from '@modules/charts-generic';
import { getAnalyticsPageLayout } from '@modules/experience-analytics-shared';
import AssistantPage from '@modules/experience-analytics/pages/Assistant/AssistantPageContainer';

const AnalyticsExploreMode: NextLayoutPage = () => {
  return <AssistantPage />;
};

AnalyticsExploreMode.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, {
    navigationItem: analyticsAssistantNavigationItem,
    omitPageTitle: true,
  });

export default AnalyticsExploreMode;
