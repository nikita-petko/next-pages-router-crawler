import React from 'react';
import type { NextLayoutPage } from 'next';
import { analyticsMonetizationNavigationItem } from '@modules/charts-generic';
import { getAnalyticsPageLayout } from '@modules/experience-analytics-shared';
import ExperienceAnalyticsMonetizationPage from '@modules/experience-analytics/pages/MonetizationPage/MonetizationPageContainer';

const MonetizationOverviewPage: NextLayoutPage = () => {
  return <ExperienceAnalyticsMonetizationPage />;
};

MonetizationOverviewPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { navigationItem: analyticsMonetizationNavigationItem });

export default MonetizationOverviewPage;
