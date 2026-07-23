import type { NextLayoutPage } from 'next';
import AnalyticsHomePage from '@modules/analytics-home-page/AnalyticsHomePageContentContainer';
import getAnalyticsHomePageLayout from '@modules/analytics-home-page/getAnalyticsHomePageLayout';

const Analytics: NextLayoutPage = () => {
  return <AnalyticsHomePage />;
};

Analytics.getPageLayout = getAnalyticsHomePageLayout;
Analytics.loggerConfig = { rosId: RosTeams.Analytics };

export default Analytics;
