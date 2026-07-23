import React from 'react';
import type { NextLayoutPage } from 'next';
import { getAnalyticsPageLayout } from '@modules/experience-analytics-shared';
import AlertConfigurationsPage from '@modules/experience-alerts/pages/AlertConfigurationsPage';
import { analyticsAlertsNavigationItem } from '@modules/charts-generic';

const AlertsPage: NextLayoutPage = () => {
  return <AlertConfigurationsPage />;
};

AlertsPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { navigationItem: analyticsAlertsNavigationItem });

export default AlertsPage;
