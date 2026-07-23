import type { FC, ReactNode } from 'react';
import { StatusBanners } from '@modules/charts-generic/components/StatusBanner';
import { useRAQIV2ConfigurablePageSurfaceContext } from './layout/RAQIV2ConfigurablePageContext';

const AnalyticsStatusBanner: FC<{
  bannerClassNameOverride?: string;
  fallbackBanner?: ReactNode;
}> = ({ bannerClassNameOverride, fallbackBanner }) => {
  const { activeBanners } = useRAQIV2ConfigurablePageSurfaceContext();

  if (activeBanners.length > 0) {
    return (
      <StatusBanners
        bannerConfigs={activeBanners}
        bannerClassNameOverride={bannerClassNameOverride}
      />
    );
  }

  return fallbackBanner ?? null;
};

export default AnalyticsStatusBanner;
