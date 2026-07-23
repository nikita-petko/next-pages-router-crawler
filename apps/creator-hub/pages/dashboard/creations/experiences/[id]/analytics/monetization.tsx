import type { NextLayoutPage } from 'next';
import { analyticsMonetizationNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import UrlRedirectProvider from '@modules/experience-analytics-shared/context/UrlRedirectProvider';
import getAnalyticsPageLayout from '@modules/experience-analytics-shared/pages/getUniverseAnalyticsPageLayout';
import ExperienceAnalyticsMonetizationPage from '@modules/experience-analytics/pages/MonetizationPage/MonetizationPageContainer';

const MonetizationAnalyticsPage: NextLayoutPage = () => {
  return (
    <UrlRedirectProvider>
      <ExperienceAnalyticsMonetizationPage />
    </UrlRedirectProvider>
  );
};

MonetizationAnalyticsPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { navigationItem: analyticsMonetizationNavigationItem });
MonetizationAnalyticsPage.loggerConfig = { rosId: RosTeams.Analytics };

export default MonetizationAnalyticsPage;
