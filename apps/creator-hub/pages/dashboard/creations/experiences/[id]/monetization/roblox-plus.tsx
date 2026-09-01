import type { NextLayoutPage } from 'next';
import getAnalyticsPageLayout from '@modules/experience-analytics-shared/pages/getUniverseAnalyticsPageLayout';
import BountyPayoutsPage from '@modules/experience-analytics/pages/BountyPayoutsPage/BountyPayoutsPage';

const BountyPayoutsAnalyticsPage: NextLayoutPage = () => {
  return <BountyPayoutsPage />;
};

BountyPayoutsAnalyticsPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, {
    noNavigationItem: true,
    context: { title: 'Heading.RobloxPlusDeveloperProgram' },
  });
BountyPayoutsAnalyticsPage.loggerConfig = { rosId: RosTeams.Subscriptions };

export default BountyPayoutsAnalyticsPage;
