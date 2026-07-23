import React from 'react';
import type { NextLayoutPage } from 'next';
import PlayerFeedbackPageContainer from '@modules/player-feedback/components/PlayerFeedbackPageContainer';
import { getAnalyticsPageLayout } from '@modules/experience-analytics-shared';
import { analyticsFeedbackNavigationItem } from '@modules/charts-generic';

const Overview: NextLayoutPage = () => {
  return <PlayerFeedbackPageContainer />;
};

Overview.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { navigationItem: analyticsFeedbackNavigationItem });

export default Overview;
