import React, { useMemo } from 'react';
import { TRAQIV2APIMetric, RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import { BannerConfiguration } from '@modules/charts-generic';
import {
  CreatorAnalyticsPageSurfaceConfig,
  CreatorAnalyticsPageConfig,
} from '../../../types/RAQIV2PageConfig';
import getPredefinedComponentMetrics from '../../../utils/getPredefinedComponentMetrics';
import { BannerCustomTarget, BannerKey } from '../../../constants/statusConfig';
import { useAnalyticsBannerConfiguration } from '../../../hooks/useStatusConfiguration';
import { AnalyticsContextLayerInnerProvider } from '../../../context/AnalyticsContextLayerProvider';
import getCreatorAnalyticsPageSurfaceConfig from '../../../utils/getCreatorAnalyticsPageSurfaceConfig';

type RAQIV2ConfigurablePageSurfaceContextType = {
  pageVisibleMetrics: TRAQIV2APIMetric[];
  activeBanners: BannerConfiguration<BannerKey>[];
};

const RAQIV2ConfigurablePageSurfaceContext =
  React.createContext<RAQIV2ConfigurablePageSurfaceContextType>({
    pageVisibleMetrics: [],
    activeBanners: [],
  });

export const useRAQIV2ConfigurablePageSurfaceContext = () => {
  const context = React.useContext(RAQIV2ConfigurablePageSurfaceContext);
  if (!context) {
    throw new Error(
      'RAQIV2PredefinedSurfaceBodyContext must be used within a RAQIV2PredefinedSurfaceBodyContextProvider',
    );
  }
  return context;
};

export const useRAQIV2ConfigurablePageSurfaceContextMetricsOrNull = ():
  | TRAQIV2APIMetric[]
  | null => {
  const context = React.useContext(RAQIV2ConfigurablePageSurfaceContext);
  return context.pageVisibleMetrics;
};

type RAQIV2ConfigurablePageSurfaceContextProviderProp<
  TTab extends string,
  TDim extends RAQIV2Dimension,
  TDimValues extends string,
> = {
  config: CreatorAnalyticsPageConfig<TTab, TDim, TDimValues>;
};

export function RAQIV2ConfigurablePageSurfaceContextProvider<
  TTab extends string,
  TDim extends RAQIV2Dimension,
  TDimValues extends string,
>({
  children,
  config,
}: React.PropsWithChildren<
  RAQIV2ConfigurablePageSurfaceContextProviderProp<TTab, TDim, TDimValues>
>) {
  const surfaceConfig: CreatorAnalyticsPageSurfaceConfig = useMemo(
    () => getCreatorAnalyticsPageSurfaceConfig(config),
    [config],
  );

  const pageVisibleMetrics = useMemo(
    () => surfaceConfig.body.map(getPredefinedComponentMetrics).flat(),
    [surfaceConfig.body],
  );
  const bannerTargets = useMemo(
    () => [...pageVisibleMetrics, BannerCustomTarget.AllAnalytics],
    [pageVisibleMetrics],
  );
  const { data } = useAnalyticsBannerConfiguration(bannerTargets);
  const contextValue = useMemo(
    () => ({ pageVisibleMetrics, activeBanners: data }),
    [data, pageVisibleMetrics],
  );

  return (
    <RAQIV2ConfigurablePageSurfaceContext.Provider value={contextValue}>
      <AnalyticsContextLayerInnerProvider config={surfaceConfig}>
        {children}
      </AnalyticsContextLayerInnerProvider>
    </RAQIV2ConfigurablePageSurfaceContext.Provider>
  );
}
