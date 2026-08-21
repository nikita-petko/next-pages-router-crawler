import {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useSyncExternalStore,
} from 'react';
import { OrderedChartColors, type ChartColor } from '@rbx/analytics-ui';
import type { TRAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import type { RAQIV2BreakdownValue } from '@modules/clients/analytics';
import {
  BreakdownColorConsistencyContext,
  type BreakdownColorSnapshot,
  type BreakdownValueKey,
  EMPTY_BREAKDOWN_COLOR_SNAPSHOT,
  getBreakdownValueKey,
  getDimensionSetKey,
} from '../context/BreakdownColorConsistencyContext';

export type BreakdownColorLookup = (
  breakdownValues: readonly RAQIV2BreakdownValue[],
) => ChartColor | undefined;

const noopLookup: BreakdownColorLookup = () => {};
const noopSubscribe = (): (() => void) => () => {};

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
  if (breakdownValues.length === 0) {
    return true;
  }
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
 * @param breakdownDimensions The breakdown dimensions from the chart spec
 * @param seriesBreakdownValues Breakdown values for each series, in rendering order
 */
const useBreakdownColors = (
  breakdownDimensions: readonly TRAQIV2Dimension[] | undefined,
  seriesBreakdownValues: ReadonlyArray<readonly RAQIV2BreakdownValue[]>,
): BreakdownColorLookup => {
  const colorContext = useContext(BreakdownColorConsistencyContext);
  const store = colorContext?.store;
  const recordSeriesOrder = colorContext?.recordSeriesOrder;
  const dimensionSetKey = useMemo(
    () => getDimensionSetKey(breakdownDimensions),
    [breakdownDimensions],
  );
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!store || !dimensionSetKey) {
        return noopSubscribe();
      }
      return store.subscribe(dimensionSetKey, onStoreChange);
    },
    [dimensionSetKey, store],
  );
  const getDimensionSetSnapshot = useCallback((): BreakdownColorSnapshot => {
    if (!store || !dimensionSetKey) {
      return EMPTY_BREAKDOWN_COLOR_SNAPSHOT;
    }
    return store.getSnapshot(dimensionSetKey);
  }, [dimensionSetKey, store]);
  const snapshot = useSyncExternalStore(
    subscribe,
    getDimensionSetSnapshot,
    getDimensionSetSnapshot,
  );
  const dimensionSet = useMemo(
    () => new Set<string>(breakdownDimensions ?? []),
    [breakdownDimensions],
  );

  const batchKeys = useMemo(() => {
    const collectedKeys: BreakdownValueKey[] = [];
    seriesBreakdownValues.forEach((breakdownValues) => {
      if (!seriesMatchesDimensions(breakdownValues, dimensionSet)) {
        return;
      }
      const valueKey = getBreakdownValueKey([...breakdownValues]);
      if (valueKey) {
        collectedKeys.push(valueKey);
      }
    });
    return collectedKeys;
  }, [dimensionSet, seriesBreakdownValues]);

  // Unassigned keys return undefined so the chart keeps its default Blue
  // (the total-series color) until the layout effect commits the
  // collision-aware batch and subscribers refresh against one snapshot.
  useLayoutEffect(() => {
    if (!dimensionSetKey || !store || batchKeys.length === 0) {
      return;
    }
    store.registerBatch(dimensionSetKey, batchKeys);
  }, [batchKeys, dimensionSetKey, store]);

  const lookup: BreakdownColorLookup = useMemo(() => {
    if (!dimensionSetKey || !store) {
      return noopLookup;
    }

    return (breakdownValues: readonly RAQIV2BreakdownValue[]) => {
      if (!seriesMatchesDimensions(breakdownValues, dimensionSet)) {
        return undefined;
      }
      const valueKey = getBreakdownValueKey([...breakdownValues]);
      if (!valueKey) {
        return undefined;
      }
      const latestSnapshot = store.getSnapshot(dimensionSetKey);
      const lookupSnapshot = latestSnapshot === snapshot ? snapshot : latestSnapshot;
      const colorIndex = store.getColorIndex(lookupSnapshot, valueKey);
      return colorIndex === undefined ? undefined : OrderedChartColors[colorIndex];
    };
  }, [dimensionSetKey, dimensionSet, snapshot, store]);

  useEffect(() => {
    if (!dimensionSetKey || !recordSeriesOrder) {
      return;
    }

    const orderedValueKeys = seriesBreakdownValues
      .filter((bvs) => seriesMatchesDimensions(bvs, dimensionSet))
      .map((bvs) => getBreakdownValueKey([...bvs]));
    recordSeriesOrder(dimensionSetKey, orderedValueKeys);
  }, [dimensionSetKey, dimensionSet, seriesBreakdownValues, recordSeriesOrder]);

  return lookup;
};

export default useBreakdownColors;
