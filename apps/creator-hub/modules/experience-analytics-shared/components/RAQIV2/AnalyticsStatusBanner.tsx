import React, { FC } from 'react';
import { StatusBanners } from '@modules/charts-generic';
import { useRAQIV2ConfigurablePageSurfaceContext } from './layout/RAQIV2ConfigurablePageContext';

const AnalyticsStatusBanner: FC<{ bannerClassNameOverride?: string }> = ({
  bannerClassNameOverride,
}) => {
  const { activeBanners } = useRAQIV2ConfigurablePageSurfaceContext();
  return (
    <StatusBanners
      bannerConfigs={activeBanners}
      bannerClassNameOverride={bannerClassNameOverride}
    />
  );
};

export default AnalyticsStatusBanner;
