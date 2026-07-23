import type { NextLayoutPage } from 'next';
import { analyticsCrashesNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import getAnalyticsPageLayout from '@modules/experience-analytics-shared/pages/getUniverseAnalyticsPageLayout';
import CrashesPageContent from '@modules/experience-monitoring/pages/CrashesPage/CrashesPageContent';

const CrashesAnalyticsPage: NextLayoutPage = () => {
  return <CrashesPageContent />;
};

CrashesAnalyticsPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { navigationItem: analyticsCrashesNavigationItem });
CrashesAnalyticsPage.loggerConfig = { rosId: RosTeams.Analytics };

export default CrashesAnalyticsPage;
