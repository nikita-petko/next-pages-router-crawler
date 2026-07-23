import { useContext, useEffect, useMemo } from 'react';
import type { ChartColor } from '@rbx/analytics-ui';
import type { RAQIV2BreakdownValue } from '@modules/clients/analytics';
import type { TRAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import { FeatureFlagNamespace } from '@modules/feature-flags/namespaces';
import { useFeatureFlagsForNamespace } from '@modules/feature-flags/context/FeatureFlagsProvider';
import {
  BreakdownColorConsistencyContext,
  getBreakdownValueKey,
  getDimensionSetKey,
} from '../context/BreakdownColorConsistencyContext';

export type BreakdownColorLookup = (
  breakdownValues: readonly RAQIV2BreakdownValue[],
) => ChartColor | undefined;

const noopLookup: BreakdownColorLookup = () => undefined;

/**
 * Returns true when every dimension in `breakdownValues` is a member of
 * `dimensionSet`. Empty breakdown values (total series) always pass because
 * they don't carry dimension info.
 *
 * This guards against registering stale series data under the wrong dimension
 * set during breakdown transitions: `breakdownDimensions` (from the spec)
 * updates immediately, but `seriesBreakdownValues` (from the API response)
 * lags until the new response arrives.
 */
const seriesMatchesDimensions = (
  breakdownValues: readonly RAQIV2BreakdownValue[],
  dimensionSet: ReadonlySet<string>,
): boolean => {
  if (breakdownValues.length === 0) return true;
  return breakdownValues.every((bv) => !bv.dimension || dimensionSet.has(bv.dimension));
};

/**
 * Registers breakdown values with the page-wide color consistency context
 * and returns a lookup function that maps breakdown values to a stable ChartColor.
 *
 * Series without breakdown values (e.g., total series) get `undefined` from the
 * lookup, letting the chart component apply its own default styling.
 *
 * After rendering, records the series ordering so the context can detect
 * adjacency conflicts and rebalance colors when the palette wraps.
 *
 * Gated behind the isBreakdownColorConsistencyEnabled feature flag.
 * When the flag is off, the lookup always returns `undefined` (no-op).
 *
 * @param breakdownDimensions The breakdown dimensions from the chart spec
 * @param seriesBreakdownValues Breakdown values for each series, in rendering order
 */
const useBreakdownColors = (
  breakdownDimensions: readonly TRAQIV2Dimension[] | undefined,
  seriesBreakdownValues: ReadonlyArray<readonly RAQIV2BreakdownValue[]>,
): BreakdownColorLookup => {
  const { isBreakdownColorConsistencyEnabled } = useFeatureFlagsForNamespace(
    'isBreakdownColorConsistencyEnabled',
    FeatureFlagNamespace.Analytics,
  );
  const { getOrAssignColor, recordSeriesOrder } = useContext(BreakdownColorConsistencyContext);
  const dimensionSetKey = useMemo(
    () => getDimensionSetKey(breakdownDimensions),
    [breakdownDimensions],
  );
  const dimensionSet = useMemo(
    () => new Set<string>(breakdownDimensions ?? []),
    [breakdownDimensions],
  );

  // Eagerly register all breakdown values so colors are assigned in rendering order.
  // Skip any series whose dimensions don't match the current breakdownDimensions —
  // this prevents stale API response data from polluting a newly-selected dimension
  // set's color map during the transition window while fresh data loads.
  useMemo(() => {
    if (!isBreakdownColorConsistencyEnabled || !dimensionSetKey) return;

    seriesBreakdownValues.forEach((breakdownValues) => {
      if (!seriesMatchesDimensions(breakdownValues, dimensionSet)) return;
      const valueKey = getBreakdownValueKey([...breakdownValues]);
      if (valueKey) {
        getOrAssignColor(dimensionSetKey, valueKey);
      }
    });
  }, [
    isBreakdownColorConsistencyEnabled,
    dimensionSetKey,
    dimensionSet,
    seriesBreakdownValues,
    getOrAssignColor,
  ]);

  const lookup: BreakdownColorLookup = useMemo(() => {
    if (!isBreakdownColorConsistencyEnabled || !dimensionSetKey) {
      return noopLookup;
    }

    return (breakdownValues: readonly RAQIV2BreakdownValue[]) => {
      if (!seriesMatchesDimensions(breakdownValues, dimensionSet)) return undefined;
      const valueKey = getBreakdownValueKey([...breakdownValues]);
      if (!valueKey) return undefined;
      return getOrAssignColor(dimensionSetKey, valueKey);
    };
  }, [isBreakdownColorConsistencyEnabled, dimensionSetKey, dimensionSet, getOrAssignColor]);

  useEffect(() => {
    if (!isBreakdownColorConsistencyEnabled || !dimensionSetKey) return;

    const orderedValueKeys = seriesBreakdownValues
      .filter((bvs) => seriesMatchesDimensions(bvs, dimensionSet))
      .map((bvs) => getBreakdownValueKey([...bvs]));
    recordSeriesOrder(dimensionSetKey, orderedValueKeys);
  }, [
    isBreakdownColorConsistencyEnabled,
    dimensionSetKey,
    dimensionSet,
    seriesBreakdownValues,
    recordSeriesOrder,
  ]);

  return lookup;
};

export default useBreakdownColors;
