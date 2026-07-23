import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import { analyticsAiChatNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import UrlRedirectProvider from '@modules/experience-analytics-shared/context/UrlRedirectProvider';
import getAnalyticsPageLayout from '@modules/experience-analytics-shared/pages/getUniverseAnalyticsPageLayout';

const AnalyticsAIChatRedirect: NextLayoutPage = () => {
  return (
    <Authenticated>
      <UrlRedirectProvider />
    </Authenticated>
  );
};

AnalyticsAIChatRedirect.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, {
    navigationItem: analyticsAiChatNavigationItem,
    omitPageTitle: true,
  });
AnalyticsAIChatRedirect.loggerConfig = { rosId: RosTeams.Analytics };

export default AnalyticsAIChatRedirect;
