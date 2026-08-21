import { useMemo } from 'react';
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

const getComputedMetricForQuerySignature = (metric: ComputedMetric): string =>
  JSON.stringify({
    ...metric,
    name: undefined,
  });

const isSerializedComputedMetricSource = (
  source: unknown,
): source is ComputedMetric['sources'][number] => {
  if (!source || typeof source !== 'object' || !('key' in source) || !('metric' in source)) {
    return false;
  }
  if (typeof source.key !== 'string') {
    return false;
  }
  const { metric } = source;
  if (typeof metric === 'string') {
    return true;
  }
  return (
    metric !== null &&
    typeof metric === 'object' &&
    'metric' in metric &&
    typeof metric.metric === 'string'
  );
};

const isSerializedComputedMetric = (value: unknown): value is ComputedMetric => {
  if (
    !value ||
    typeof value !== 'object' ||
    !('sources' in value) ||
    !Array.isArray(value.sources) ||
    value.sources.length === 0 ||
    !value.sources.every(isSerializedComputedMetricSource) ||
    !('formula' in value) ||
    typeof value.formula !== 'string'
  ) {
    return false;
  }
  return true;
};

const parseComputedMetricForQuerySignature = (signature: string): ComputedMetric => {
  const parsed: unknown = JSON.parse(signature);
  if (!isSerializedComputedMetric(parsed)) {
    throw new Error('Invalid computed metric query signature');
  }
  return {
    ...parsed,
    name: undefined,
  };
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
 * unnecessarily. A canonical primitive signature drives a pure memo producer,
 * so equivalent query payloads reconstruct only when that signature changes.
 */
export function useActiveMetricForQuery({
  executionMetric,
  computedMetric,
  operationsDraftMetric,
  isOperationsToggleOn,
}: UseActiveMetricForQueryArgs): UseActiveMetricForQueryResult {
  const effectiveComputedMetric =
    isOperationsToggleOn && operationsDraftMetric ? operationsDraftMetric : computedMetric;

  const computedMetricForQuery =
    isOperationsToggleOn && effectiveComputedMetric
      ? effectiveComputedMetric
      : executionMetric && isComputedMetric(executionMetric)
        ? executionMetric
        : null;
  const computedMetricForQuerySignature = computedMetricForQuery
    ? getComputedMetricForQuerySignature(computedMetricForQuery)
    : null;
  const stableComputedMetricForQuery = useMemo(
    () =>
      computedMetricForQuerySignature
        ? parseComputedMetricForQuerySignature(computedMetricForQuerySignature)
        : null,
    [computedMetricForQuerySignature],
  );

  const activeMetricForQuery: MetricLike | null = isOperationsToggleOn
    ? stableComputedMetricForQuery
    : (stableComputedMetricForQuery ?? executionMetric);

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
