import React from 'react';
import type { NextLayoutPage } from 'next';
import { getAnalyticsPageLayout } from '@modules/experience-analytics-shared';
import { analyticsErrorReportNavigationItem } from '@modules/charts-generic';
import ErrorReportPageContent from '@modules/experience-monitoring/pages/ErrorReportPage/ErrorReportPageContentContainer';

const ErrorReportPage: NextLayoutPage = () => {
  return <ErrorReportPageContent />;
};

ErrorReportPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { navigationItem: analyticsErrorReportNavigationItem });

export default ErrorReportPage;
