import React from 'react';
import type { NextLayoutPage } from 'next';
import { getAnalyticsPageLayout } from '@modules/experience-analytics-shared';
import CreateAlertPage from '@modules/experience-alerts/pages/CreateAlertPage';
import { analyticsAlertCreationNavigationItem } from '@modules/charts-generic';

const CreateAlert: NextLayoutPage = () => {
  return <CreateAlertPage />;
};

CreateAlert.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { navigationItem: analyticsAlertCreationNavigationItem });

export default CreateAlert;
