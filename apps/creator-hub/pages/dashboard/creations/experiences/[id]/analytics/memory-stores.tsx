import React from 'react';
import type { NextLayoutPage } from 'next';
import { getAnalyticsPageLayout } from '@modules/experience-analytics-shared';
import { analyticsMemoryStoresNavigationItem } from '@modules/charts-generic';
import MemoryStoresPageContent from '@modules/cloud-services/insights/pages/MemoryStoresPageContent';

const MemoryStoresAnalyticsPage: NextLayoutPage = () => {
  return <MemoryStoresPageContent />;
};

MemoryStoresAnalyticsPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { navigationItem: analyticsMemoryStoresNavigationItem });

export default MemoryStoresAnalyticsPage;
