import React from 'react';
import type { NextLayoutPage } from 'next';
import { analyticsSpeechToTextNavigationItem } from '@modules/charts-generic';
import SpeechToTextPageContent from '@modules/cloud-services/insights/pages/SpeechToTextPageContent';
import { getAnalyticsPageLayout } from '@modules/experience-analytics-shared';

const SpeechToTextAnalyticsPage: NextLayoutPage = () => {
  return <SpeechToTextPageContent />;
};

SpeechToTextAnalyticsPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { navigationItem: analyticsSpeechToTextNavigationItem });

export default SpeechToTextAnalyticsPage;
