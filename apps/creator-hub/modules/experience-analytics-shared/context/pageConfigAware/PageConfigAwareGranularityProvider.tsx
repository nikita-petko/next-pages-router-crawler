/**
 * Layer 2: Page Config Aware Granularity Provider
 *
 * This provider consumes raw query params from Layer 1 and applies page-config-based defaults
 * for granularity. It provides the same context type as AnalyticsCurrentGranularityBundleContext.
 */

import type { FC } from 'react';
import React, { useMemo, useCallback, useContext } from 'react';
import AnalyticsQueryDateRangeBundleContext from '@modules/charts-generic/context/AnalyticsQueryDateRangeBundleContext';
import type { CreatorAnalyticsPageSurfaceConfig } from '../../types/RAQIV2PageConfig';
import type { TUIGranularity } from '../../utils/seriesGranularities';
import {
  getClosestAllowedGranularity,
  getSeriesDefaultGranularity,
} from '../../utils/seriesGranularities';
import { AnalyticsCurrentGranularityBundleContext } from '../AnalyticsCurrentGranularityProvider';
import { useRawAnalyticsQueryParams } from '../rawQueryParams/RawAnalyticsQueryParamsProvider';

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
  const defaultGranularity = config?.defaultGranularity;
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
      if (defaultGranularity) {
        return getClosestAllowedGranularity({
          startDate,
          endDate,
          granularity: defaultGranularity,
          supportedGranularities,
        });
      }
      return getSeriesDefaultGranularity(startDate, endDate);
    }

    // If set, ensure it's allowed for the current date range
    return getClosestAllowedGranularity({
      startDate,
      endDate,
      granularity: rawGranularity,
      supportedGranularities,
    });
  }, [defaultGranularity, granularityConfig, rawParams.granularity, startDate, endDate]);

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
