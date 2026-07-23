import type { NextLayoutPage } from 'next';
import { SnackbarProvider } from '@rbx/ui';
import { analyticsMessagingServiceNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import MessagingServicePageContent from '@modules/cloud-services/insights/pages/MessagingServicePageContent';
import getAnalyticsPageLayout from '@modules/experience-analytics-shared/pages/getUniverseAnalyticsPageLayout';

const MessagingServiceAnalyticsPage: NextLayoutPage = () => {
  return (
    <SnackbarProvider>
      <MessagingServicePageContent />
    </SnackbarProvider>
  );
};

MessagingServiceAnalyticsPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { navigationItem: analyticsMessagingServiceNavigationItem });
MessagingServiceAnalyticsPage.loggerConfig = { rosId: RosTeams.Analytics };

export default MessagingServiceAnalyticsPage;
