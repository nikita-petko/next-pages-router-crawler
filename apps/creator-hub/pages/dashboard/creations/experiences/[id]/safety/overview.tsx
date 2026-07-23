import React from 'react';
import type { NextLayoutPage } from 'next';
import { analyticsSafetyNavigationItem } from '@modules/charts-generic';
import { getAnalyticsPageLayout } from '@modules/experience-analytics-shared';
import ExperienceAnalyticsSafetyPage from '@modules/experience-analytics/pages/Safety/SafetyOverviewPageContainer';

const SafetyOverviewPage: NextLayoutPage = () => {
  return <ExperienceAnalyticsSafetyPage />;
};

// Translation Key found in Navigation Namespace
SafetyOverviewPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { navigationItem: analyticsSafetyNavigationItem });

export default SafetyOverviewPage;
