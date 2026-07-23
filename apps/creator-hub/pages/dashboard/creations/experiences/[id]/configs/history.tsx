import React from 'react';
import type { NextLayoutPage } from 'next';
import { analyticsConfigsHistoryNavigationItem } from '@modules/charts-generic';
import { getAnalyticsPageLayout } from '@modules/experience-analytics-shared';
import HistoryPageContainer from '@modules/remote-configs/HistoryPage';

const HistoryPage: NextLayoutPage = () => {
  return <HistoryPageContainer />;
};

HistoryPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { navigationItem: analyticsConfigsHistoryNavigationItem });

export default HistoryPage;
