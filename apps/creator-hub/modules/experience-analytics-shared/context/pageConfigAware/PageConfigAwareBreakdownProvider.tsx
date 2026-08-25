import type { FC } from 'react';
/**
 * Layer 2: Page Config Aware Breakdown Provider
 *
 * This provider consumes raw query params from Layer 1 and applies page-config-based defaults
 * for breakdown dimensions. It provides to the EXISTING AnalyticsCurrentBreakdownContext
 * so that existing hooks continue to work unchanged.
 */
import React, { useMemo, useCallback, useContext, useEffect, useRef } from 'react';
import type { TRAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import { toSelectableBreakdownDimension } from '../../chartConfigurator/ChartConfiguratorDimensions';
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
  const hasAppliedDefaultsRef = useRef(false);

  // Get supported and default breakdowns from config
  const supportedDimensions = useMemo(() => config?.breakdownDimensions ?? [], [config]);
  const defaultBreakdown = useMemo(() => config?.defaultBreakdown ?? [], [config]);

  // Derive the effective breakdown (pure computation — no side effects).
  // Map raw PlaceVersion to LatestPlaceVersion when the page OPTIONS include
  // the Top-N stand-in; keep the raw dim when a predefined page still lists it.
  const breakdown = useMemo<TRAQIV2Dimension[]>(() => {
    const rawBreakdown = rawParams.breakdown;

    if (rawBreakdown === undefined) {
      if (defaultBreakdown.length > 0) {
        return [...defaultBreakdown];
      }
      return [];
    }

    const supported = new Set(supportedDimensions);
    const resolved: TRAQIV2Dimension[] = [];
    const seen = new Set<TRAQIV2Dimension>();
    for (const dimension of rawBreakdown) {
      const mapped = toSelectableBreakdownDimension(dimension);
      const kept = supported.has(mapped) ? mapped : supported.has(dimension) ? dimension : null;
      if (kept === null || seen.has(kept)) {
        continue;
      }
      seen.add(kept);
      resolved.push(kept);
    }
    return resolved;
  }, [rawParams, supportedDimensions, defaultBreakdown]);

  // Sync defaults to the URL query params as a side effect
  useEffect(() => {
    if (
      rawParams.breakdown === undefined &&
      defaultBreakdown.length > 0 &&
      !hasAppliedDefaultsRef.current
    ) {
      rawParams.setBreakdown([...defaultBreakdown]);
      hasAppliedDefaultsRef.current = true;
    }
  }, [rawParams, defaultBreakdown]);

  // Canonicalize shareable URLs: when the resolved breakdown differs from the
  // raw param (e.g. an old `breakdown=PlaceVersion` link mapping to
  // LatestPlaceVersion, or unsupported dims that were dropped), write the
  // resolved value back once so the URL converges. One-shot on load; later
  // user edits are honored without re-canonicalizing.
  const hasCanonicalizedRef = useRef(false);
  useEffect(() => {
    if (hasCanonicalizedRef.current || rawParams.breakdown === undefined) {
      return;
    }
    const raw = rawParams.breakdown;
    if (breakdown.length === raw.length && breakdown.every((dim, i) => dim === raw[i])) {
      return;
    }
    rawParams.setBreakdown(breakdown);
    hasCanonicalizedRef.current = true;
  }, [rawParams, breakdown]);

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
