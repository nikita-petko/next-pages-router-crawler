import React from 'react';
import type { NextLayoutPage } from 'next';
import { getAnalyticsPageLayout } from '@modules/experience-analytics-shared';
import ConfigureAlertPage from '@modules/experience-alerts/pages/ConfigureAlertPage';
import { analyticsAlertConfifurationNavigationItem } from '@modules/charts-generic';

const ConfigureAlert: NextLayoutPage = () => {
  return <ConfigureAlertPage />;
};

ConfigureAlert.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { navigationItem: analyticsAlertConfifurationNavigationItem });

export default ConfigureAlert;
