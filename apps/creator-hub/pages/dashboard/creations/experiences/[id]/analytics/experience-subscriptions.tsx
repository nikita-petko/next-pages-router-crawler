import type { NextLayoutPage } from 'next';
import { analyticsSubscriptionsNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import UrlRedirectProvider from '@modules/experience-analytics-shared/context/UrlRedirectProvider';
import getAnalyticsPageLayout from '@modules/experience-analytics-shared/pages/getUniverseAnalyticsPageLayout';
import ExperienceSubscriptionsPageContent from '@modules/experience-subscriptions/pages/ExperienceSubscriptionsPage/ExperienceSubscriptionsPageContentContainer';

const ExperienceSubscriptionsAnalyticsPage: NextLayoutPage = () => {
  return (
    <UrlRedirectProvider>
      <ExperienceSubscriptionsPageContent />
    </UrlRedirectProvider>
  );
};

ExperienceSubscriptionsAnalyticsPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { navigationItem: analyticsSubscriptionsNavigationItem });
ExperienceSubscriptionsAnalyticsPage.loggerConfig = { rosId: RosTeams.Analytics };

export default ExperienceSubscriptionsAnalyticsPage;
