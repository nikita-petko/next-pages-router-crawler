import type { NextLayoutPage } from 'next';
import { analyticsFeedbackNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import getAnalyticsPageLayout from '@modules/experience-analytics-shared/pages/getUniverseAnalyticsPageLayout';
import PlayerFeedbackPageContainer from '@modules/player-feedback/components/PlayerFeedbackPageContainer';

const Overview: NextLayoutPage = () => {
  return <PlayerFeedbackPageContainer />;
};

Overview.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { navigationItem: analyticsFeedbackNavigationItem });
Overview.loggerConfig = { rosId: RosTeams.GameOperations };

export default Overview;
