import React from 'react';
import type { NextLayoutPage } from 'next';
import { SnackbarProvider } from '@rbx/ui';
import { analyticsMessagingServiceNavigationItem } from '@modules/charts-generic';
import MessagingServicePageContent from '@modules/cloud-services/insights/pages/MessagingServicePageContent';
import { getAnalyticsPageLayout } from '@modules/experience-analytics-shared';

const MessagingServiceAnalyticsPage: NextLayoutPage = () => {
  return (
    <SnackbarProvider>
      <MessagingServicePageContent />
    </SnackbarProvider>
  );
};

MessagingServiceAnalyticsPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { navigationItem: analyticsMessagingServiceNavigationItem });

export default MessagingServiceAnalyticsPage;
