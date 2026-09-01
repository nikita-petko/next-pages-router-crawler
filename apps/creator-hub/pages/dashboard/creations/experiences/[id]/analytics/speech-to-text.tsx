import type { NextLayoutPage } from 'next';
import { analyticsSpeechToTextNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import SpeechToTextPageContent from '@modules/cloud-services/insights/pages/SpeechToTextPageContent';
import getAnalyticsPageLayout from '@modules/experience-analytics-shared/pages/getUniverseAnalyticsPageLayout';

const SpeechToTextAnalyticsPage: NextLayoutPage = () => {
  return <SpeechToTextPageContent />;
};

SpeechToTextAnalyticsPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { navigationItem: analyticsSpeechToTextNavigationItem });
SpeechToTextAnalyticsPage.loggerConfig = { rosId: RosTeams.Analytics };

export default SpeechToTextAnalyticsPage;
