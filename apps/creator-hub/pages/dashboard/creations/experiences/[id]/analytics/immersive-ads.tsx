import React from 'react';
import type { NextLayoutPage } from 'next';
import { analyticsImmersiveAdsNavigationItem } from '@modules/charts-generic';
import { UrlRedirectProvider, getAnalyticsPageLayout } from '@modules/experience-analytics-shared';
import ImmersiveAdsPageContentV2 from '@modules/immersive-ads/pages/ImmersiveAdsPageContentV2';

const ImmersiveAdsAnalyticsPage: NextLayoutPage = () => {
  return (
    <UrlRedirectProvider>
      <ImmersiveAdsPageContentV2 />
    </UrlRedirectProvider>
  );
};

ImmersiveAdsAnalyticsPage.getPageLayout = (page) =>
  getAnalyticsPageLayout(page, { navigationItem: analyticsImmersiveAdsNavigationItem });

export default ImmersiveAdsAnalyticsPage;
