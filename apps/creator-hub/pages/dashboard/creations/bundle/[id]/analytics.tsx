import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import getBundlePageLayout from '@modules/creations/bundleConfiguration/layout/getBundlePageLayout';
import ItemAnalyticsContainer from '@modules/creations/itemAnalytics/components/ItemAnalyticsContainer';
import AnalyticsOwnerOverrideProvider from '@modules/experience-analytics-shared/context/AnalyticsOwnerOverrideProvider';

const Analytics: NextLayoutPage = () => (
  <Authenticated>
    <AnalyticsOwnerOverrideProvider>
      <ItemAnalyticsContainer isBundle />
    </AnalyticsOwnerOverrideProvider>
  </Authenticated>
);

Analytics.getPageLayout = getBundlePageLayout;
Analytics.loggerConfig = { rosId: RosTeams.AvatarMarketplace };

export default Analytics;
