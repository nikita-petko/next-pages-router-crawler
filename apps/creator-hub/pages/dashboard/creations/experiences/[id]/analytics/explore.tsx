import React from 'react';
import type { NextLayoutPage } from 'next';
import { getAnalyticsPageLayout } from '@modules/experience-analytics-shared';
import ExperienceAnalyticsExploreMode from '@modules/experience-analytics/pages/ExploreMode/ExperienceAnalyticsExploreModePageContainer';
import { analyticsExploreNavigationItem } from '@modules/charts-generic';

const AnalyticsExploreMode: NextLayoutPage = () => {
  return <ExperienceAnalyticsExploreMode />;
};

AnalyticsExploreMode.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { navigationItem: analyticsExploreNavigationItem });

export default AnalyticsExploreMode;
