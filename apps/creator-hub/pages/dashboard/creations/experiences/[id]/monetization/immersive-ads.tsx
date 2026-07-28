import type { NextLayoutPage } from 'next';
import { analyticsImmersiveAdsNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import getAnalyticsPageLayout from '@modules/experience-analytics-shared/pages/getUniverseAnalyticsPageLayout';
import ImmersiveAdsPageContentV2 from '@modules/immersive-ads/pages/ImmersiveAdsPageContentV2';

const MonetizationImmersiveAdsPage: NextLayoutPage = () => {
  return <ImmersiveAdsPageContentV2 />;
};

MonetizationImmersiveAdsPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { navigationItem: analyticsImmersiveAdsNavigationItem });
MonetizationImmersiveAdsPage.loggerConfig = { rosId: RosTeams.AdvertiserPublisherExperience };

export default MonetizationImmersiveAdsPage;
