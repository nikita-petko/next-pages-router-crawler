import React from 'react';
import type { NextLayoutPage } from 'next';
import { SnackbarProvider } from '@rbx/ui';
import { analyticsHttpServiceNavigationItem } from '@modules/charts-generic';
import HttpServicePageContent from '@modules/cloud-services/insights/pages/HttpServicePageContent';
import { getAnalyticsPageLayout } from '@modules/experience-analytics-shared';

const HttpServiceAnalyticsPage: NextLayoutPage = () => {
  return (
    <SnackbarProvider>
      <HttpServicePageContent />
    </SnackbarProvider>
  );
};

HttpServiceAnalyticsPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { navigationItem: analyticsHttpServiceNavigationItem });

export default HttpServiceAnalyticsPage;
