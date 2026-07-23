import React, { useMemo } from 'react';
import type { TRAQIV2APIMetric, RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import type { BannerConfiguration } from '@modules/charts-generic/components/StatusBanner';
import type { BannerKey } from '../../../constants/statusConfig';
import { BannerCustomTarget } from '../../../constants/statusConfig';
import { AnalyticsContextLayerInnerProvider } from '../../../context/AnalyticsContextLayerProvider';
import { useAnalyticsBannerConfiguration } from '../../../hooks/useStatusConfiguration';
import type {
  CreatorAnalyticsPageSurfaceConfig,
  CreatorAnalyticsPageConfig,
} from '../../../types/RAQIV2PageConfig';
import getCreatorAnalyticsPageSurfaceConfig from '../../../utils/getCreatorAnalyticsPageSurfaceConfig';
import getPredefinedComponentMetrics from '../../../utils/getPredefinedComponentMetrics';

type RAQIV2ConfigurablePageSurfaceContextType = {
  pageVisibleMetrics: TRAQIV2APIMetric[];
  activeBanners: BannerConfiguration<BannerKey>[];
};

const emptyBanners: BannerConfiguration<BannerKey>[] = [];

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

/**
 * Lightweight provider that overrides `pageVisibleMetrics` without a full page config.
 * Used by the equation builder to give each source card's filter drawer the correct
 * metric context so `useCurrentAnalyticsPageContextMetrics()` resolves per-source.
 */
export function SourceMetricContextProvider({
  children,
  metrics,
}: React.PropsWithChildren<{ metrics: TRAQIV2APIMetric[] }>) {
  const contextValue = useMemo(
    () => ({ pageVisibleMetrics: metrics, activeBanners: emptyBanners }),
    [metrics],
  );
  return (
    <RAQIV2ConfigurablePageSurfaceContext.Provider value={contextValue}>
      {children}
    </RAQIV2ConfigurablePageSurfaceContext.Provider>
  );
}

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
    () => surfaceConfig.body.flatMap(getPredefinedComponentMetrics),
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
