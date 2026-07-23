import type { NextLayoutPage } from 'next';
import { analyticsMemoryStoresNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import MemoryStoresPageContent from '@modules/cloud-services/insights/pages/MemoryStoresPageContent';
import getAnalyticsPageLayout from '@modules/experience-analytics-shared/pages/getUniverseAnalyticsPageLayout';

const MemoryStoresAnalyticsPage: NextLayoutPage = () => {
  return <MemoryStoresPageContent />;
};

MemoryStoresAnalyticsPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { navigationItem: analyticsMemoryStoresNavigationItem });
MemoryStoresAnalyticsPage.loggerConfig = { rosId: RosTeams.Analytics };

export default MemoryStoresAnalyticsPage;
