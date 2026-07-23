import React, { FC, useMemo } from 'react';
import { StatusBanners } from '@modules/charts-generic';
import {
  BannerCustomTarget,
  useAnalyticsBannerConfiguration,
} from '@modules/experience-analytics-shared';
import { Grid } from '@rbx/ui';

const immersiveAdsBannerTargets = [BannerCustomTarget.AdsAnalytics];

const AnalyticsDataBanner: FC = () => {
  const { data: activeBanners } = useAnalyticsBannerConfiguration(immersiveAdsBannerTargets);

  const immersiveAdsAnalyticsBannersContent = useMemo(() => {
    if (activeBanners.length === 0) {
      return null;
    }

    return (
      <Grid container sx={{ marginTop: '16px' }}>
        <StatusBanners key='status-banner' bannerConfigs={activeBanners} />
      </Grid>
    );
  }, [activeBanners]);

  return immersiveAdsAnalyticsBannersContent;
};

export default AnalyticsDataBanner;
