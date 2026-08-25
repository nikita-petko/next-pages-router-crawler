import type { NextLayoutPage } from 'next';
import { analyticsCreationOverviewNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import AgeRestrictedOverviewBanner from '@modules/creations-overview/components/AgeRestrictedOverviewBanner';
import OverviewPageContainer from '@modules/creations-overview/containers/OverviewPageContainer';
import getAnalyticsPageLayout from '@modules/experience-analytics-shared/pages/getUniverseAnalyticsPageLayout';

const Overview: NextLayoutPage = () => {
  return (
    <>
      <AgeRestrictedOverviewBanner />
      <OverviewPageContainer />
    </>
  );
};

Overview.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, {
    navigationItem: analyticsCreationOverviewNavigationItem,
    omitPageTitle: true,
  });
Overview.loggerConfig = { rosId: RosTeams.Analytics };

export default Overview;
