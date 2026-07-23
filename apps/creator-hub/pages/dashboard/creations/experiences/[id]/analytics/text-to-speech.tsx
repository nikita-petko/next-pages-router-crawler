import type { NextLayoutPage } from 'next';
import { analyticsTextToSpeechNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import TextToSpeechPageContent from '@modules/cloud-services/insights/pages/TextToSpeechPageContent';
import getAnalyticsPageLayout from '@modules/experience-analytics-shared/pages/getUniverseAnalyticsPageLayout';

const TextToSpeechAnalyticsPage: NextLayoutPage = () => {
  return <TextToSpeechPageContent />;
};

TextToSpeechAnalyticsPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { navigationItem: analyticsTextToSpeechNavigationItem });
TextToSpeechAnalyticsPage.loggerConfig = { rosId: RosTeams.Analytics };

export default TextToSpeechAnalyticsPage;
