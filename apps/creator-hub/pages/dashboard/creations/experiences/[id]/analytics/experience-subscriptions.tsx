import React from 'react';
import type { NextLayoutPage } from 'next';
import { UrlRedirectProvider, getAnalyticsPageLayout } from '@modules/experience-analytics-shared';
import ExperienceSubscriptionsPageContent from '@modules/experience-subscriptions/pages/ExperienceSubscriptionsPage/ExperienceSubscriptionsPageContentContainer';
import { analyticsSubscriptionsNavigationItem } from '@modules/charts-generic';

const ExperienceSubscriptionsAnalyticsPage: NextLayoutPage = () => {
  return (
    <UrlRedirectProvider>
      <ExperienceSubscriptionsPageContent />
    </UrlRedirectProvider>
  );
};

ExperienceSubscriptionsAnalyticsPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { navigationItem: analyticsSubscriptionsNavigationItem });

export default ExperienceSubscriptionsAnalyticsPage;
