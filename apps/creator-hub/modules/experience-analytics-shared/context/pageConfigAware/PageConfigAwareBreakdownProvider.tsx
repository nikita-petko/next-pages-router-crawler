/**
 * Layer 2: Page Config Aware Breakdown Provider
 *
 * This provider consumes raw query params from Layer 1 and applies page-config-based defaults
 * for breakdown dimensions. It provides to the EXISTING AnalyticsCurrentBreakdownContext
 * so that existing hooks continue to work unchanged.
 */

import React, { FC, useMemo, useCallback, useContext, useState } from 'react';
import { TRAQIV2BreakdownDimension } from '@modules/clients/analytics';
import { useRawAnalyticsQueryParams } from '../rawQueryParams';
import { CreatorAnalyticsPageSurfaceConfig } from '../../types/RAQIV2PageConfig';
import { ExperienceAnalyticsBreakdownBundle } from '../useQueryBasedBreakdownBundle';
import { AnalyticsCurrentBreakdownContext } from '../AnalyticsCurrentBreakdownBundleProvider';

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

  // Get the effective breakdown with defaulting logic
  const breakdown = useMemo<TRAQIV2BreakdownDimension[]>(() => {
    const rawBreakdown = rawParams.breakdown;

    // If raw breakdown is undefined (not set), apply defaults
    if (rawBreakdown === undefined) {
      // Apply default breakdown if available
      if (defaultBreakdown.length > 0 && !hasAppliedDefaults) {
        // Defer setting to avoid render-during-render
        setTimeout(() => {
          rawParams.setBreakdown([...defaultBreakdown]);
          setHasAppliedDefaults(true);
        }, 0);
        return [...defaultBreakdown];
      }
      return [];
    }

    // Filter to only supported dimensions
    const filteredBreakdown = rawBreakdown.filter((dim) => supportedDimensions.includes(dim));
    return filteredBreakdown;
  }, [rawParams, supportedDimensions, defaultBreakdown, hasAppliedDefaults]);

  const setBreakdown = useCallback(
    (newBreakdown: TRAQIV2BreakdownDimension[]) => {
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
