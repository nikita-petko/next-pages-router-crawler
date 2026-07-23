import type { NextLayoutPage } from 'next';
import { analyticsMonetizationNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import getAnalyticsPageLayout from '@modules/experience-analytics-shared/pages/getUniverseAnalyticsPageLayout';
import ExperienceAnalyticsMonetizationPage from '@modules/experience-analytics/pages/MonetizationPage/MonetizationPageContainer';

const MonetizationOverviewPage: NextLayoutPage = () => {
  return <ExperienceAnalyticsMonetizationPage />;
};

MonetizationOverviewPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { navigationItem: analyticsMonetizationNavigationItem });
MonetizationOverviewPage.loggerConfig = { rosId: RosTeams.CreatorBusiness };

export default MonetizationOverviewPage;
