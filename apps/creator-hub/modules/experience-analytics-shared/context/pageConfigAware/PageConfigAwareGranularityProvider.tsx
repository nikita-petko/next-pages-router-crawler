/**
 * Layer 2: Page Config Aware Granularity Provider
 *
 * This provider consumes raw query params from Layer 1 and applies page-config-based defaults
 * for granularity. It provides the same context type as AnalyticsCurrentGranularityBundleContext.
 */

import React, { FC, useMemo, useCallback, useContext } from 'react';
import { AnalyticsQueryDateRangeBundleContext } from '@modules/charts-generic';
import { useRawAnalyticsQueryParams } from '../rawQueryParams';
import { CreatorAnalyticsPageSurfaceConfig } from '../../types/RAQIV2PageConfig';
import { AnalyticsCurrentGranularityBundleContext } from '../AnalyticsCurrentGranularityProvider';
import {
  TUIGranularity,
  getClosestAllowedGranularity,
  getSeriesDefaultGranularity,
} from '../../utils/seriesGranularities';

type PageConfigAwareGranularityProviderProps = {
  children: React.ReactNode;
  config?: CreatorAnalyticsPageSurfaceConfig;
};

export const PageConfigAwareGranularityProvider: FC<PageConfigAwareGranularityProviderProps> = ({
  children,
  config,
}) => {
  const rawParams = useRawAnalyticsQueryParams();
  const granularityConfig = config?.granularity;
  const { startDate, endDate } = useContext(AnalyticsQueryDateRangeBundleContext);

  // Calculate effective granularity with defaulting
  const granularity = useMemo<TUIGranularity>(() => {
    // If fixed granularity is specified in config, use that
    if (granularityConfig && 'fixed' in granularityConfig) {
      return granularityConfig.fixed;
    }

    const rawGranularity = rawParams.granularity;
    const supportedGranularities =
      granularityConfig && 'options' in granularityConfig ? granularityConfig.options : [];

    // If not set in query params, calculate default based on date range
    if (!rawGranularity) {
      return getSeriesDefaultGranularity(startDate, endDate);
    }

    // If set, ensure it's allowed for the current date range
    return getClosestAllowedGranularity({
      startDate,
      endDate,
      granularity: rawGranularity,
      supportedGranularities,
    });
  }, [granularityConfig, rawParams.granularity, startDate, endDate]);

  const onChangeGranularity = useCallback(
    (newGranularity: TUIGranularity) => {
      rawParams.setGranularity(newGranularity);
    },
    [rawParams],
  );

  const bundle = useMemo(
    () => ({
      granularity,
      onChangeGranularity,
    }),
    [granularity, onChangeGranularity],
  );

  return (
    <AnalyticsCurrentGranularityBundleContext.Provider value={bundle}>
      {children}
    </AnalyticsCurrentGranularityBundleContext.Provider>
  );
};

export default PageConfigAwareGranularityProvider;
