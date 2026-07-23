import React from 'react';
import type { NextLayoutPage } from 'next';
import { analyticsAiChatNavigationItem } from '@modules/charts-generic';
import { getAnalyticsPageLayout } from '@modules/experience-analytics-shared';
import ExperienceAnalyticsAIChatPageContainer from '@modules/experience-analytics/pages/AIChat/AIChatPageContainer';

const AnalyticsAIChat: NextLayoutPage = () => {
  return <ExperienceAnalyticsAIChatPageContainer />;
};

AnalyticsAIChat.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, {
    navigationItem: analyticsAiChatNavigationItem,
    omitPageTitle: true,
  });

export default AnalyticsAIChat;
