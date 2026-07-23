import React from 'react';
import type { NextLayoutPage } from 'next';
import { analyticsExperienceCreatorRewardsNavigationItem } from '@modules/charts-generic';
import { getAnalyticsPageLayout } from '@modules/experience-analytics-shared';
import CreatorRewardsPage from '@modules/experience-analytics/pages/CreatorRewardsPage/CreatorRewardsPage';

const CreatorRewardsAnalyticsPage: NextLayoutPage = () => {
  return <CreatorRewardsPage />;
};

CreatorRewardsAnalyticsPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { navigationItem: analyticsExperienceCreatorRewardsNavigationItem });

export default CreatorRewardsAnalyticsPage;
