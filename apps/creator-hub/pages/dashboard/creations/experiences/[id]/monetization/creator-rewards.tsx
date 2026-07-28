import type { NextLayoutPage } from 'next';
import { analyticsExperienceCreatorRewardsNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import getAnalyticsPageLayout from '@modules/experience-analytics-shared/pages/getUniverseAnalyticsPageLayout';
import CreatorRewardsPage from '@modules/experience-analytics/pages/CreatorRewardsPage/CreatorRewardsPage';

const CreatorRewardsAnalyticsPage: NextLayoutPage = () => {
  return <CreatorRewardsPage />;
};

CreatorRewardsAnalyticsPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { navigationItem: analyticsExperienceCreatorRewardsNavigationItem });
CreatorRewardsAnalyticsPage.loggerConfig = { rosId: RosTeams.GameOperations };

export default CreatorRewardsAnalyticsPage;
