import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import getAssetPageLayout from '@modules/creations/asset/layout/getAssetPageLayout';
import ItemAnalyticsContainer from '@modules/creations/itemAnalytics/components/ItemAnalyticsContainer';
import AnalyticsOwnerOverrideProvider from '@modules/experience-analytics-shared/context/AnalyticsOwnerOverrideProvider';

const Analytics: NextLayoutPage = () => (
  <Authenticated>
    <AnalyticsOwnerOverrideProvider>
      <ItemAnalyticsContainer />
    </AnalyticsOwnerOverrideProvider>
  </Authenticated>
);

Analytics.getPageLayout = getAssetPageLayout;
Analytics.loggerConfig = { rosId: RosTeams.AvatarMarketplace };

export default Analytics;
