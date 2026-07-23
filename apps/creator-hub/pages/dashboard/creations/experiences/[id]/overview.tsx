import React from 'react';
import type { NextLayoutPage } from 'next';
import OverviewPageContainer from '@modules/creations-overview/containers/OverviewPageContainer';
import AgeRestrictedOverviewBanner from '@modules/creations-overview/components/AgeRestrictedOverviewBanner';
import { getAnalyticsPageLayout } from '@modules/experience-analytics-shared';
import { analyticsCreationOverviewNavigationItem } from '@modules/charts-generic';

const Overview: NextLayoutPage = () => {
  return (
    <React.Fragment>
      <AgeRestrictedOverviewBanner />
      <OverviewPageContainer />
    </React.Fragment>
  );
};

Overview.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { navigationItem: analyticsCreationOverviewNavigationItem });

export default Overview;
