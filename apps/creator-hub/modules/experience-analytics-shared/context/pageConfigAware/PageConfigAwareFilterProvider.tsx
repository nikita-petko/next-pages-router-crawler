/**
 * Layer 2: Page Config Aware Filter Provider
 *
 * This provider consumes raw query params from Layer 1 and applies page-config-based defaults
 * for filters. It provides to the EXISTING AnalyticsCurrentFilterBundleContext so that
 * existing hooks continue to work unchanged.
 */

import React, { FC, useMemo, useCallback, useContext, useState, useEffect } from 'react';
import { TRAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import { useRawAnalyticsQueryParams } from '../rawQueryParams';
import { CreatorAnalyticsPageSurfaceConfig } from '../../types/RAQIV2PageConfig';
import {
  UIFilters,
  UIFilterDimension,
} from '../../layout/ExperienceAnalyticsPageControlBar/filterUtils';
import legacyFiltersToRAQIV2 from '../../adapters/legacyFiltersToRAQIV2';
import { getFilterBarDimensionForRAQIV2Dimension } from '../../constants/FilterDimensionConfig';
import {
  ExperienceAnalyticsCurrentFilterBundle,
  AnalyticsCurrentFilterBundleContext,
} from '../AnalyticsCurrentFilterBundleProvider';

// Re-export for convenience
export { AnalyticsCurrentFilterBundleContext as PageConfigAwareFilterContext };

type PageConfigAwareFilterProviderProps = {
  children: React.ReactNode;
  config?: CreatorAnalyticsPageSurfaceConfig;
};

export const PageConfigAwareFilterProvider: FC<PageConfigAwareFilterProviderProps> = ({
  children,
  config,
}) => {
  const rawParams = useRawAnalyticsQueryParams();
  const [hasAppliedDefaults, setHasAppliedDefaults] = useState(false);

  // Get filter config from surface config
  const filterDimensions = useMemo(() => config?.filterDimensions ?? [], [config]);
  const defaultFilters = useMemo(() => config?.defaultFilters ?? [], [config]);

  // Convert RAQI dimensions to filter bar dimensions
  const knownDimensions = useMemo(() => {
    return filterDimensions.flatMap((dim) => getFilterBarDimensionForRAQIV2Dimension(dim) || []);
  }, [filterDimensions]);

  // Get raw filters from Layer 1
  const knownFilters = rawParams.filters;

  // Apply default filters on initialization
  useEffect(() => {
    if (hasAppliedDefaults) return;

    if (!defaultFilters || defaultFilters.length === 0) {
      setHasAppliedDefaults(true);
      return;
    }

    const knownDimensionSet = new Set<UIFilterDimension>(knownDimensions);
    const currentFilters = knownFilters.filter(({ dimension }) => knownDimensionSet.has(dimension));

    // Only apply defaults if there are no existing filters for those dimensions
    const initFilters = defaultFilters.filter(
      (filter) =>
        knownDimensions.some((dim) => dim === filter.dimension) &&
        !currentFilters.some((f) => f.dimension === filter.dimension),
    );

    if (initFilters.length > 0) {
      const newFilters: UIFilters = [...currentFilters, ...initFilters];
      rawParams.setFilters(newFilters, knownDimensions);
    }

    setHasAppliedDefaults(true);
  }, [hasAppliedDefaults, defaultFilters, knownDimensions, knownFilters, rawParams]);

  // Callback to change known filters
  const onKnownFiltersChange = useCallback(
    (newFilters: UIFilters, dims: Readonly<Array<UIFilterDimension>>) => {
      rawParams.setFilters(newFilters, dims);
    },
    [rawParams],
  );

  const onUnsupportedDimensionFilterDelete = useCallback(
    (dimension: TRAQIV2Dimension) => {
      rawParams.clearFilterDimension(dimension);
    },
    [rawParams],
  );

  // Provide to the existing context with the raw type
  const rawBundle = useMemo(
    () => ({
      knownFilters,
      onKnownFiltersChange,
      onUnsupportedDimensionFilterDelete,
    }),
    [knownFilters, onKnownFiltersChange, onUnsupportedDimensionFilterDelete],
  );

  return (
    <AnalyticsCurrentFilterBundleContext.Provider value={rawBundle}>
      {children}
    </AnalyticsCurrentFilterBundleContext.Provider>
  );
};

/**
 * Hook to get filter bundle that is filtered to supported dimensions
 * and has defaults applied. This is a convenience hook for Layer 2-aware code.
 * Existing code can continue using useRAQIAnalyticsCurrentFilterBundle.
 */
export const usePageConfigAwareFilterBundle = (
  raqiDimensions: ReadonlyArray<TRAQIV2Dimension>,
): ExperienceAnalyticsCurrentFilterBundle => {
  const { knownFilters, onKnownFiltersChange, onUnsupportedDimensionFilterDelete } = useContext(
    AnalyticsCurrentFilterBundleContext,
  );
  const raqiFilters = useMemo(() => {
    return legacyFiltersToRAQIV2(knownFilters);
  }, [knownFilters]);

  const knownDimensions = useMemo(() => {
    return raqiDimensions.flatMap((dim) => getFilterBarDimensionForRAQIV2Dimension(dim) || []);
  }, [raqiDimensions]);

  return useMemo(() => {
    const knownDimensionSet = new Set<UIFilterDimension>(knownDimensions);
    const filters = knownFilters.filter(({ dimension }) => knownDimensionSet.has(dimension));
    const onFiltersChange = (newFilters: UIFilters) =>
      onKnownFiltersChange(newFilters, knownDimensions);
    return { filters, onFiltersChange, raqiFilters, onUnsupportedDimensionFilterDelete };
  }, [
    knownDimensions,
    knownFilters,
    raqiFilters,
    onUnsupportedDimensionFilterDelete,
    onKnownFiltersChange,
  ]);
};

export default PageConfigAwareFilterProvider;
