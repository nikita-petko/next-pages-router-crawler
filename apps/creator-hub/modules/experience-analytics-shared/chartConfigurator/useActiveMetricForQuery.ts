import { useLayoutEffect, useMemo, useRef } from 'react';
import { isComputedMetric, type ComputedMetric, type MetricLike } from '../types/ComputedMetric';

export type UseActiveMetricForQueryArgs = {
  /**
   * The resolved metric the page is currently executing — atomic when simple
   * mode is on, computed when operations are on. Derived by the parent from
   * URL state and the computed metric context. Treat as read-only input;
   * the hook never writes back into it.
   */
  executionMetric: MetricLike | null;
  /** The committed computed metric from URL/context state. */
  computedMetric: ComputedMetric | null;
  /** Local in-progress edits to the computed metric; takes precedence when the operations toggle is on. */
  operationsDraftMetric: ComputedMetric | null;
  /** UI state: true while the user has the "Use operations" toggle on. Not a feature flag. */
  isOperationsToggleOn: boolean;
};

export type UseActiveMetricForQueryResult = {
  /**
   * The metric to actually run queries against. Computed metrics are
   * `name`-stripped so renaming a formula does not refetch the chart.
   * Identity-stable across renders when the underlying computed-metric
   * payload (sources + formula) does not change.
   */
  activeMetricForQuery: MetricLike | null;
  /** Convenience: `Boolean(activeMetricForQuery && isComputedMetric(activeMetricForQuery))`. */
  isActiveMetricComputed: boolean;
  /**
   * The computed metric to render in the sidebar UI. Mirrors `computedMetric`
   * but lets in-progress draft edits flow into the sidebar before they are
   * committed back to URL state.
   */
  effectiveComputedMetric: ComputedMetric | null;
  /**
   * User-provided name to surface in the chart title for computed metrics.
   * `undefined` when the metric is atomic, when the user has not named the
   * formula yet, or when only whitespace was entered.
   */
  computedMetricChartTitleLabel: string | undefined;
};

/**
 * Resolves the metric the chart should query against, given the page's
 * computed-metric / operations-toggle state.
 *
 * The hook centralises three cohesive pieces:
 *   1. Picking between the committed computed metric and the in-progress
 *      draft (`effectiveComputedMetric`).
 *   2. Returning a `name`-stripped, identity-stable copy for query consumers
 *      (`activeMetricForQuery`).
 *   3. Surfacing the user-provided title for chart rendering
 *      (`computedMetricChartTitleLabel`).
 *
 * Stability of `activeMetricForQuery` is critical: chart query keys are
 * derived from this value, so re-emitting a fresh object on every render
 * (e.g. because the user typed in the formula name) would refetch the chart
 * unnecessarily. The hook caches the last emitted reference and returns it
 * whenever the underlying signature is unchanged.
 */
export function useActiveMetricForQuery({
  executionMetric,
  computedMetric,
  operationsDraftMetric,
  isOperationsToggleOn,
}: UseActiveMetricForQueryArgs): UseActiveMetricForQueryResult {
  const effectiveComputedMetric =
    isOperationsToggleOn && operationsDraftMetric ? operationsDraftMetric : computedMetric;

  const cacheRef = useRef<{
    signature: string | null;
    metric: ComputedMetric | null;
  }>({
    signature: null,
    metric: null,
  });

  const activeMetricForQuery = useMemo<MetricLike | null>(() => {
    if (isOperationsToggleOn) {
      if (!effectiveComputedMetric) {
        return null;
      }
      const computedMetricForQuery: ComputedMetric = {
        ...effectiveComputedMetric,
        name: undefined,
      };
      const signature = JSON.stringify(computedMetricForQuery);
      const cached = cacheRef.current;
      if (cached.signature === signature && cached.metric) {
        return cached.metric;
      }
      return computedMetricForQuery;
    }
    if (!executionMetric) {
      return null;
    }
    if (!isComputedMetric(executionMetric)) {
      return executionMetric;
    }

    const computedMetricForQuery: ComputedMetric = {
      ...executionMetric,
      name: undefined,
    };
    const signature = JSON.stringify(computedMetricForQuery);
    const cached = cacheRef.current;
    if (cached.signature === signature && cached.metric) {
      return cached.metric;
    }
    return computedMetricForQuery;
  }, [effectiveComputedMetric, executionMetric, isOperationsToggleOn]);

  // Sync the cache after render. Done in a layout effect (not during the
  // memo) so we never mutate during render.
  useLayoutEffect(() => {
    if (!activeMetricForQuery || !isComputedMetric(activeMetricForQuery)) {
      cacheRef.current = { signature: null, metric: null };
      return;
    }
    cacheRef.current = {
      signature: JSON.stringify(activeMetricForQuery),
      metric: activeMetricForQuery,
    };
  }, [activeMetricForQuery]);

  const isActiveMetricComputed = useMemo(
    () => Boolean(activeMetricForQuery && isComputedMetric(activeMetricForQuery)),
    [activeMetricForQuery],
  );

  const computedMetricChartTitleLabel = useMemo<string | undefined>(() => {
    if (!activeMetricForQuery || !isComputedMetric(activeMetricForQuery)) {
      return undefined;
    }
    const metricForTitle = isOperationsToggleOn
      ? effectiveComputedMetric
      : executionMetric && isComputedMetric(executionMetric)
        ? executionMetric
        : null;
    if (!metricForTitle) {
      return undefined;
    }
    // Surface only an explicit user-provided name. Never thread the raw
    // formula text into the chart title — when the user hasn't named the
    // formula yet we fall through to `untitledFormulaLabel` at the call site.
    const trimmedName = metricForTitle.name?.trim();
    // Fall through to `untitledFormulaLabel` at the call site for both
    // missing names and whitespace-only names; nullish coalescing alone
    // would leak the empty string.
    if (trimmedName === undefined || trimmedName === '') {
      return undefined;
    }
    return trimmedName;
  }, [activeMetricForQuery, effectiveComputedMetric, executionMetric, isOperationsToggleOn]);

  return {
    activeMetricForQuery,
    isActiveMetricComputed,
    effectiveComputedMetric,
    computedMetricChartTitleLabel,
  };
}
