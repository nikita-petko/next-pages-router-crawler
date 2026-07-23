import React from 'react';
import type { NextLayoutPage } from 'next';
import { getAnalyticsPageLayout } from '@modules/experience-analytics-shared';
import { analyticsCrashesNavigationItem } from '@modules/charts-generic';
import CrashesPageContent from '@modules/experience-monitoring/pages/CrashesPage/CrashesPageContent';

const CrashesAnalyticsPage: NextLayoutPage = () => {
  return <CrashesPageContent />;
};

CrashesAnalyticsPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { navigationItem: analyticsCrashesNavigationItem });

export default CrashesAnalyticsPage;
