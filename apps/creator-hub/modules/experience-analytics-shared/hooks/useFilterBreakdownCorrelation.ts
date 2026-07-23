import { useEffect, useMemo, useRef } from 'react';
import { RAQIV2QueryFilter, TRAQIV2BreakdownDimension } from '@modules/clients/analytics';
import {
  RAQIV2Dimension,
  RAQIV2UIPseudoDimension,
  TRAQIV2Dimension,
} from '@rbx/creator-hub-analytics-config';
import {
  UIFilters,
  updateFilterSingleValue,
} from '../layout/ExperienceAnalyticsPageControlBar/filterUtils';
import { useExperienceAnalyticsGameDetails } from '../context/ExperienceAnalyticsGameDetailsProvider';
import { useRAQIAnalyticsCurrentFilterBundle } from '../context/AnalyticsCurrentFilterBundleProvider';
import {
  useAnalyticsCurrentBreakdownBundleAndSetDefaults,
  useAnalyticsCurrentBreakdownBundleUnfiltered,
} from '../context/AnalyticsCurrentBreakdownBundleProvider';

function isPlaceVersionBreakdownActive(breakdown: readonly TRAQIV2BreakdownDimension[]): boolean {
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
  breakdown: TRAQIV2BreakdownDimension[];
  filter: UIFilters;
};

function useFilterBreakdownConstraintCore({
  breakdown,
  filters,
  onFiltersChange,
  setBreakdown,
  fallbackBreakdown,
}: {
  breakdown: readonly TRAQIV2BreakdownDimension[];
  filters: UIFilters;
  onFiltersChange: (filters: UIFilters) => void;
  setBreakdown: (breakdown: TRAQIV2BreakdownDimension[]) => void;
  fallbackBreakdown: TRAQIV2BreakdownDimension[];
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
  const sanitizedBreakdown: TRAQIV2BreakdownDimension[] = useMemo(() => {
    if (isPlaceVersionBreakdown && !hasPlaceSelected) {
      return fallbackBreakdown;
    }
    return [...breakdown];
  }, [breakdown, fallbackBreakdown, hasPlaceSelected, isPlaceVersionBreakdown]);

  return { breakdown: sanitizedBreakdown, filter: filters };
}

type UseFilterBreakdownConstraintProps = {
  allowableBreakdownDimensions: ReadonlyArray<TRAQIV2BreakdownDimension>;
  defaultBreakdown?: ReadonlyArray<TRAQIV2BreakdownDimension>;
  allowableFilterDimensions: ReadonlyArray<TRAQIV2Dimension>;
  defaultFilters?: RAQIV2QueryFilter[];
};

/**
 * Ensures consistent UX/data constraints for the PlaceVersion breakdown:
 * - If switching to PlaceVersion with no Place selected, auto-select root Place
 * - If Place is cleared while on PlaceVersion, reset breakdown to default
 */
export default function useFilterBreakdownConstraint({
  allowableBreakdownDimensions,
  defaultBreakdown,
  allowableFilterDimensions,
  defaultFilters,
}: UseFilterBreakdownConstraintProps): TConstraintFilterAndBreakdown {
  const { breakdown, setBreakdown } = useAnalyticsCurrentBreakdownBundleAndSetDefaults(
    allowableBreakdownDimensions,
    defaultBreakdown,
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
  breakdown: readonly TRAQIV2BreakdownDimension[];
  dimensions: readonly TRAQIV2BreakdownDimension[];
};

export function useFilterBreakdownConstraintForExplore({
  breakdown,
  dimensions,
}: UseFilterBreakdownConstraintEffectProps): TConstraintFilterAndBreakdown {
  const { setBreakdown } = useAnalyticsCurrentBreakdownBundleUnfiltered();
  const { filters, onFiltersChange } = useRAQIAnalyticsCurrentFilterBundle(dimensions);

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
