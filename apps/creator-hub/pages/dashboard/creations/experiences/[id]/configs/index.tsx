import React from 'react';
import type { NextLayoutPage } from 'next';
import { analyticsConfigsNavigationItem } from '@modules/charts-generic';
import { getAnalyticsPageLayout } from '@modules/experience-analytics-shared';
import RemoteConfigsPage from '@modules/remote-configs/CreatorConfigsHubPage';

const ConfigsPage: NextLayoutPage = () => {
  return <RemoteConfigsPage />;
};

ConfigsPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { navigationItem: analyticsConfigsNavigationItem });

export default ConfigsPage;
