import React from 'react';
import type { NextLayoutPage } from 'next';
import { getAnalyticsPageLayout, UrlRedirectProvider } from '@modules/experience-analytics-shared';
import ExperienceAnalyticsMonetizationPage from '@modules/experience-analytics/pages/MonetizationPage/MonetizationPageContainer';
import { analyticsMonetizationNavigationItem } from '@modules/charts-generic';

const MonetizationAnalyticsPage: NextLayoutPage = () => {
  return (
    <UrlRedirectProvider>
      <ExperienceAnalyticsMonetizationPage />
    </UrlRedirectProvider>
  );
};

MonetizationAnalyticsPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { navigationItem: analyticsMonetizationNavigationItem });

export default MonetizationAnalyticsPage;
