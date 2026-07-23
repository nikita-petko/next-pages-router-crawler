import type { FC } from 'react';
/**
 * Layer 2: Page Config Aware Breakdown Provider
 *
 * This provider consumes raw query params from Layer 1 and applies page-config-based defaults
 * for breakdown dimensions. It provides to the EXISTING AnalyticsCurrentBreakdownContext
 * so that existing hooks continue to work unchanged.
 */
import React, { useMemo, useCallback, useContext, useEffect, useState } from 'react';
import type { TRAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import type { CreatorAnalyticsPageSurfaceConfig } from '../../types/RAQIV2PageConfig';
import { AnalyticsCurrentBreakdownContext } from '../AnalyticsCurrentBreakdownBundleProvider';
import { useRawAnalyticsQueryParams } from '../rawQueryParams/RawAnalyticsQueryParamsProvider';
import type { ExperienceAnalyticsBreakdownBundle } from '../useQueryBasedBreakdownBundle';

// Re-export for convenience
export { AnalyticsCurrentBreakdownContext as PageConfigAwareBreakdownContext };

type PageConfigAwareBreakdownProviderProps = {
  children: React.ReactNode;
  config?: CreatorAnalyticsPageSurfaceConfig;
};

export const PageConfigAwareBreakdownProvider: FC<PageConfigAwareBreakdownProviderProps> = ({
  children,
  config,
}) => {
  const rawParams = useRawAnalyticsQueryParams();
  const [hasAppliedDefaults, setHasAppliedDefaults] = useState(false);

  // Get supported and default breakdowns from config
  const supportedDimensions = useMemo(() => config?.breakdownDimensions ?? [], [config]);
  const defaultBreakdown = useMemo(() => config?.defaultBreakdown ?? [], [config]);

  // Derive the effective breakdown (pure computation — no side effects)
  const breakdown = useMemo<TRAQIV2Dimension[]>(() => {
    const rawBreakdown = rawParams.breakdown;

    if (rawBreakdown === undefined) {
      if (defaultBreakdown.length > 0) {
        return [...defaultBreakdown];
      }
      return [];
    }

    return rawBreakdown.filter((dim) => supportedDimensions.includes(dim));
  }, [rawParams, supportedDimensions, defaultBreakdown]);

  // Sync defaults to the URL query params as a side effect
  useEffect(() => {
    if (rawParams.breakdown === undefined && defaultBreakdown.length > 0 && !hasAppliedDefaults) {
      rawParams.setBreakdown([...defaultBreakdown]);
      setHasAppliedDefaults(true);
    }
  }, [rawParams, defaultBreakdown, hasAppliedDefaults]);

  const setBreakdown = useCallback(
    (newBreakdown: TRAQIV2Dimension[]) => {
      rawParams.setBreakdown(newBreakdown);
    },
    [rawParams],
  );

  const bundle = useMemo<ExperienceAnalyticsBreakdownBundle>(
    () => ({
      breakdown,
      setBreakdown,
    }),
    [breakdown, setBreakdown],
  );

  // Provide to the existing AnalyticsCurrentBreakdownContext so that
  // existing hooks (useAnalyticsCurrentBreakdownBundleUnfiltered, etc.) continue to work.
  return (
    <AnalyticsCurrentBreakdownContext.Provider value={bundle}>
      {children}
    </AnalyticsCurrentBreakdownContext.Provider>
  );
};

/**
 * Hook to get breakdown bundle that is filtered to supported dimensions
 * and has defaults applied. This uses the same context as existing hooks,
 * so it's equivalent to useAnalyticsCurrentBreakdownBundleUnfiltered.
 */
export const usePageConfigAwareBreakdownBundle = (): ExperienceAnalyticsBreakdownBundle => {
  return useContext(AnalyticsCurrentBreakdownContext);
};

export default PageConfigAwareBreakdownProvider;
