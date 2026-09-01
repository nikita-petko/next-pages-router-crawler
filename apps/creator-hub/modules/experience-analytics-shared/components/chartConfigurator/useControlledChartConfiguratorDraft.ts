import { useCallback, useEffect, useMemo, useReducer, useRef, type Dispatch } from 'react';
import type { RAQIV2DateRangeType } from '@rbx/creator-hub-analytics-config';
import type { TChartConfiguratorMetrics } from '../../chartConfigurator/chartConfiguratorMetricsConfig';
import {
  ControlledChartConfiguratorActionType,
  controlledChartConfiguratorReducer,
  createInitialControlledChartConfiguratorState,
  deriveControlledChartConfiguratorMetrics,
  type ControlledChartConfiguratorAction,
  type ControlledChartConfiguratorInitialState,
  type ControlledChartConfiguratorState,
} from '../../chartConfigurator/controlledChartConfiguratorState';
import { isComputedMetricAllowedForExploreMode } from '../../exploreMode/resolveExploreModeQueryState';
import useStableArray from '../../hooks/useStableArray';
import type { ComputedMetric, MetricLike } from '../../types/ComputedMetric';

export type UseControlledChartConfiguratorDraftArgs = {
  readonly allowedMetrics: readonly TChartConfiguratorMetrics[];
  readonly initialState?: ControlledChartConfiguratorInitialState;
  readonly seedKey?: string;
};

/**
 * Reducer + metric-intersection draft for controlled configurator surfaces.
 *
 * Kept separate from provider-bound chart-spec derivation so hosts can put
 * `dateRangeOptions` onto page-config `supportedRanges` before the date-range
 * provider mounts. That lets leftover presets (e.g. Last 1 hour after switching
 * to a daily metric) fall back on the same render, with no post-paint snap.
 */
export type ControlledChartConfiguratorDraft = {
  readonly seedKey: string;
  readonly initialState: ControlledChartConfiguratorInitialState | undefined;
  readonly stableAllowedMetrics: readonly TChartConfiguratorMetrics[];
  readonly state: ControlledChartConfiguratorState;
  readonly dispatch: Dispatch<ControlledChartConfiguratorAction>;
  readonly metric: TChartConfiguratorMetrics | null;
  readonly computedMetric: ComputedMetric | null;
  readonly executionMetric: MetricLike | null;
  readonly displaySourceMetrics: readonly TChartConfiguratorMetrics[];
  readonly displayMetric: TChartConfiguratorMetrics | null;
  readonly dateRangeOptions: readonly RAQIV2DateRangeType[];
  readonly setMetric: (nextMetric: TChartConfiguratorMetrics | null) => void;
  readonly setComputedMetric: (nextComputedMetric: ComputedMetric | null) => void;
};

export default function useControlledChartConfiguratorDraft({
  allowedMetrics,
  initialState,
  seedKey = 'default',
}: UseControlledChartConfiguratorDraftArgs): ControlledChartConfiguratorDraft {
  const stableAllowedMetrics = useStableArray(allowedMetrics);
  const stateSeed = useMemo(
    () => ({ allowedMetrics: stableAllowedMetrics, initialState }),
    [stableAllowedMetrics, initialState],
  );
  const [state, dispatch] = useReducer(
    controlledChartConfiguratorReducer,
    stateSeed,
    createInitialControlledChartConfiguratorState,
  );

  // Reset draft state only when the seed boundary actually changes (a new
  // seedKey or allowed-metric set), not when a caller rebuilds an equivalent
  // `initialState` object. Depending on `stateSeed` identity here would wipe
  // in-progress edits whenever a parent re-created the seed with equal content.
  const reseedKey = useMemo(
    () => JSON.stringify({ seedKey, allowedMetrics: [...stableAllowedMetrics] }),
    [seedKey, stableAllowedMetrics],
  );
  const previousReseedKeyRef = useRef(reseedKey);
  useEffect(() => {
    if (previousReseedKeyRef.current === reseedKey) {
      return;
    }
    previousReseedKeyRef.current = reseedKey;
    dispatch({
      type: ControlledChartConfiguratorActionType.ResetFromSeed,
      seed: stateSeed,
    });
  }, [reseedKey, stateSeed]);

  const { metric, computedMetric } = state;

  const setMetric = useCallback(
    (nextMetric: TChartConfiguratorMetrics | null) => {
      dispatch({
        type: ControlledChartConfiguratorActionType.SetMetric,
        metric: nextMetric && stableAllowedMetrics.includes(nextMetric) ? nextMetric : null,
      });
    },
    [stableAllowedMetrics],
  );

  const setComputedMetric = useCallback(
    (nextComputedMetric: ComputedMetric | null) => {
      if (nextComputedMetric === null) {
        dispatch({
          type: ControlledChartConfiguratorActionType.SetComputedMetric,
          computedMetric: null,
        });
        return;
      }
      const isAllowed = isComputedMetricAllowedForExploreMode({
        computedMetric: nextComputedMetric,
        allowedMetrics: stableAllowedMetrics,
      });
      dispatch({
        type: ControlledChartConfiguratorActionType.SetComputedMetric,
        computedMetric: isAllowed ? nextComputedMetric : null,
      });
    },
    [stableAllowedMetrics],
  );

  const executionMetric = useMemo<MetricLike | null>(() => {
    if (computedMetric) {
      return computedMetric;
    }
    return metric;
  }, [computedMetric, metric]);

  const metricDerivation = useMemo(
    () =>
      deriveControlledChartConfiguratorMetrics({
        executionMetric,
        fallbackMetric: metric,
        allowedMetrics: stableAllowedMetrics,
      }),
    [executionMetric, metric, stableAllowedMetrics],
  );
  const displaySourceMetrics = useStableArray(metricDerivation.displaySourceMetrics);

  const displayMetric = useMemo((): TChartConfiguratorMetrics | null => {
    if (!displaySourceMetrics.length) {
      return null;
    }
    if (metric && displaySourceMetrics.some((sourceMetric) => sourceMetric === metric)) {
      return metric;
    }
    return displaySourceMetrics[0];
  }, [displaySourceMetrics, metric]);

  return {
    seedKey,
    initialState,
    stableAllowedMetrics,
    state,
    dispatch,
    metric,
    computedMetric,
    executionMetric,
    displaySourceMetrics,
    displayMetric,
    dateRangeOptions: metricDerivation.dateRangeOptions,
    setMetric,
    setComputedMetric,
  };
}
