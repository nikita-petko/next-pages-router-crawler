import React from 'react';
import type { NextLayoutPage } from 'next';
import { analyticsTextToSpeechNavigationItem } from '@modules/charts-generic';
import TextToSpeechPageContent from '@modules/cloud-services/insights/pages/TextToSpeechPageContent';
import { getAnalyticsPageLayout } from '@modules/experience-analytics-shared';

const TextToSpeechAnalyticsPage: NextLayoutPage = () => {
  return <TextToSpeechPageContent />;
};

TextToSpeechAnalyticsPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { navigationItem: analyticsTextToSpeechNavigationItem });

export default TextToSpeechAnalyticsPage;
