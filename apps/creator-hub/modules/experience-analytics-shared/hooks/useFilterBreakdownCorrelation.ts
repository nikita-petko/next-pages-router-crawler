import { useEffect, useMemo, useRef } from 'react';
import { RAQIV2Dimension, RAQIV2UIPseudoDimension } from '@rbx/creator-hub-analytics-config';
import type { TRAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import type { TQueryFilter as RAQIV2QueryFilter } from '@modules/clients/analytics/analyticsRAQIShared';
import {
  useAnalyticsCurrentBreakdownBundle,
  useAnalyticsCurrentBreakdownBundleUnfiltered,
} from '../context/AnalyticsCurrentBreakdownBundleProvider';
import { useRAQIAnalyticsCurrentFilterBundle } from '../context/AnalyticsCurrentFilterBundleProvider';
import { useExperienceAnalyticsGameDetails } from '../context/ExperienceAnalyticsGameDetailsProvider';
import type { UIFilters } from '../layout/ExperienceAnalyticsPageControlBar/filterUtils';
import { updateFilterSingleValue } from '../layout/ExperienceAnalyticsPageControlBar/filterUtils';

function isPlaceVersionBreakdownActive(breakdown: readonly TRAQIV2Dimension[]): boolean {
  return (
    (breakdown?.includes(RAQIV2UIPseudoDimension.LatestPlaceVersion) ||
      breakdown?.includes(RAQIV2Dimension.PlaceVersion)) ??
    false
  );
}

function hasPlaceFilterSelected(filters: UIFilters): boolean {
  return filters?.some((f) => f.dimension === RAQIV2Dimension.Place && (f.values?.length ?? 0) > 0);
}

type TConstraintFilterAndBreakdown = {
  breakdown: TRAQIV2Dimension[];
  filter: UIFilters;
};

function useFilterBreakdownConstraintCore({
  breakdown,
  filters,
  onFiltersChange,
  setBreakdown,
  fallbackBreakdown,
}: {
  breakdown: readonly TRAQIV2Dimension[];
  filters: UIFilters;
  onFiltersChange: (filters: UIFilters) => void;
  setBreakdown: (breakdown: TRAQIV2Dimension[]) => void;
  fallbackBreakdown: TRAQIV2Dimension[];
}): TConstraintFilterAndBreakdown {
  const prevStateRef = useRef<{
    hasPlaceSelected: boolean;
    isPlaceVersionBreakdown: boolean;
  } | null>(null);
  const { rootPlaceId } = useExperienceAnalyticsGameDetails();

  const hasPlaceSelected = useMemo(() => hasPlaceFilterSelected(filters), [filters]);
  const isPlaceVersionBreakdown = useMemo(
    () => isPlaceVersionBreakdownActive(breakdown),
    [breakdown],
  );

  useEffect(() => {
    const prev = prevStateRef.current;

    if (isPlaceVersionBreakdown) {
      if (prev?.hasPlaceSelected && !hasPlaceSelected) {
        setBreakdown([...fallbackBreakdown]);
      } else if (!prev?.isPlaceVersionBreakdown && !hasPlaceSelected && rootPlaceId) {
        const newFilters = updateFilterSingleValue(
          filters,
          RAQIV2Dimension.Place,
          rootPlaceId.toString(),
        );
        onFiltersChange(newFilters);
      }
    }

    prevStateRef.current = {
      hasPlaceSelected,
      isPlaceVersionBreakdown,
    };
  }, [
    hasPlaceSelected,
    isPlaceVersionBreakdown,
    filters,
    onFiltersChange,
    rootPlaceId,
    setBreakdown,
    fallbackBreakdown,
  ]);

  // Avoid emitting an invalid intermediate state (PlaceVersion breakdown without Place filter)
  // in the same render tick. This prevents downstream RAQIV2 requests from firing with
  // an invalid combination while the UI is transitioning.
  const sanitizedBreakdown: TRAQIV2Dimension[] = useMemo(() => {
    if (isPlaceVersionBreakdown && !hasPlaceSelected) {
      return fallbackBreakdown;
    }
    return [...breakdown];
  }, [breakdown, fallbackBreakdown, hasPlaceSelected, isPlaceVersionBreakdown]);

  return { breakdown: sanitizedBreakdown, filter: filters };
}

type UseFilterBreakdownConstraintProps = {
  allowableBreakdownDimensions: ReadonlyArray<TRAQIV2Dimension>;
  defaultBreakdown?: ReadonlyArray<TRAQIV2Dimension>;
  allowableFilterDimensions: ReadonlyArray<TRAQIV2Dimension>;
  defaultFilters?: RAQIV2QueryFilter[];
};

/**
 * Ensures consistent UX/data constraints for the PlaceVersion breakdown:
 * - If switching to PlaceVersion with no Place selected, auto-select root Place
 * - If Place is cleared while on PlaceVersion, reset breakdown to default
 *
 * Note: defaulting of `breakdown` based on page config is handled by
 * `PageConfigAwareBreakdownProvider`. Re-applying defaults here would
 * clobber a user's explicit "None" selection.
 */
export default function useFilterBreakdownConstraint({
  allowableBreakdownDimensions,
  defaultBreakdown,
  allowableFilterDimensions,
  defaultFilters,
}: UseFilterBreakdownConstraintProps): TConstraintFilterAndBreakdown {
  const { breakdown, setBreakdown } = useAnalyticsCurrentBreakdownBundle(
    allowableBreakdownDimensions,
  );
  const { filters, onFiltersChange } = useRAQIAnalyticsCurrentFilterBundle(
    allowableFilterDimensions,
    defaultFilters,
  );

  const fallbackBreakdown = useMemo(
    () =>
      (defaultBreakdown ?? []).filter(
        (d) =>
          d !== RAQIV2UIPseudoDimension.LatestPlaceVersion && d !== RAQIV2Dimension.PlaceVersion,
      ),
    [defaultBreakdown],
  );

  return useFilterBreakdownConstraintCore({
    breakdown,
    filters,
    onFiltersChange,
    setBreakdown,
    fallbackBreakdown,
  });
}

type UseFilterBreakdownConstraintEffectProps = {
  breakdown: readonly TRAQIV2Dimension[];
  dimensions: readonly TRAQIV2Dimension[];
  // Optional superset of `dimensions` for filter retrieval only. Allows
  // explore mode to surface filters for dimensions that aren't valid
  // breakdowns (e.g. CustomEventName for CustomEventsV2) so they reach
  // the chart request even though they're hidden from the filter bar.
  filterDimensions?: readonly TRAQIV2Dimension[];
};

export function useFilterBreakdownConstraintForExplore({
  breakdown,
  dimensions,
  filterDimensions,
}: UseFilterBreakdownConstraintEffectProps): TConstraintFilterAndBreakdown {
  const { setBreakdown } = useAnalyticsCurrentBreakdownBundleUnfiltered();
  const { filters, onFiltersChange } = useRAQIAnalyticsCurrentFilterBundle(
    filterDimensions ?? dimensions,
  );

  const filterBreakdownConstraintCoreProps = useMemo(
    () => ({
      breakdown,
      filters,
      onFiltersChange,
      setBreakdown,
      fallbackBreakdown: [],
    }),
    [breakdown, filters, onFiltersChange, setBreakdown],
  );

  return useFilterBreakdownConstraintCore(filterBreakdownConstraintCoreProps);
}
