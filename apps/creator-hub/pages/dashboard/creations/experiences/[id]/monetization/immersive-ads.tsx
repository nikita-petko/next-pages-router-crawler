import React from 'react';
import type { NextLayoutPage } from 'next';
import { analyticsImmersiveAdsNavigationItem } from '@modules/charts-generic';
import { getAnalyticsPageLayout } from '@modules/experience-analytics-shared';
import ImmersiveAdsPageContentV2 from '@modules/immersive-ads/pages/ImmersiveAdsPageContentV2';

const MonetizationImmersiveAdsPage: NextLayoutPage = () => {
  return <ImmersiveAdsPageContentV2 />;
};

MonetizationImmersiveAdsPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { navigationItem: analyticsImmersiveAdsNavigationItem });

export default MonetizationImmersiveAdsPage;
