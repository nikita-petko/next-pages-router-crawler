import type { NextLayoutPage } from 'next';
import { SnackbarProvider } from '@rbx/ui';
import { analyticsHttpServiceNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import HttpServicePageContent from '@modules/cloud-services/insights/pages/HttpServicePageContent';
import getAnalyticsPageLayout from '@modules/experience-analytics-shared/pages/getUniverseAnalyticsPageLayout';

const HttpServiceAnalyticsPage: NextLayoutPage = () => {
  return (
    <SnackbarProvider>
      <HttpServicePageContent />
    </SnackbarProvider>
  );
};

HttpServiceAnalyticsPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { navigationItem: analyticsHttpServiceNavigationItem });
HttpServiceAnalyticsPage.loggerConfig = { rosId: RosTeams.Analytics };

export default HttpServiceAnalyticsPage;
