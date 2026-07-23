import { useMemo } from 'react';
import { Grid } from '@rbx/ui';
import { StatusBanners } from '@modules/charts-generic/components/StatusBanner';
import { BannerCustomTarget } from '@modules/experience-analytics-shared/constants/statusConfig';
import { useAnalyticsBannerConfiguration } from '@modules/experience-analytics-shared/hooks/useStatusConfiguration';

const immersiveAdsBannerTargets = [BannerCustomTarget.AdsAnalytics];

const AnalyticsDataBanner = () => {
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
