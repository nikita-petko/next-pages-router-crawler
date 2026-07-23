import { useMemo } from 'react';
import type { TRAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import type { TimeSeriesAnnotation } from '@modules/charts-generic/charts/types/Annotations';
import { isNonEmptyArray, type NonEmptyArray } from '@modules/charts-generic/types/NonEmptyArray';
import type { RAQIV2QueryFilter } from '@modules/clients/analytics';
import { AnnotationType } from '@modules/clients/analytics';
import {
  isNumericUIMetric,
  type TRAQIV2NumericUIMetric,
} from '../constants/AnalyticsMetricDisplayConfig';
import { useExploreModeAlertSelection } from '../exploreMode/ExploreModeAlertSelectionContext';
import { getAtomicMetricsFromMetricLike, type MetricLike } from '../types/ComputedMetric';

export type ChartAnnotationSupportOverride = (
  annotationType: AnnotationType,
) => boolean | undefined;

/**
 * Function shape of `getCurrentSupportedAnnotations` returned by
 * `useCurrentAnnotationsBundleProvider`. Callers fetch it themselves and
 * pass it in so this hook stays free of resource-type plumbing and tests
 * can drive the filter directly without mocking the bundle provider.
 */
export type GetCurrentSupportedAnnotationsFn = (
  metrics: NonEmptyArray<TRAQIV2NumericUIMetric>,
  isSupportedOverride?: ChartAnnotationSupportOverride,
  targetingDimensions?: readonly TRAQIV2Dimension[],
) => TimeSeriesAnnotation[] | undefined;

type UseChartTimeSeriesAnnotationsArgs = {
  metric: MetricLike;
  /**
   * `getCurrentSupportedAnnotations` from `useCurrentAnnotationsBundleProvider`.
   * Injected by the caller — the hook intentionally does not reach into the
   * bundle provider itself so it stays a pure filter over its inputs.
   */
  getCurrentSupportedAnnotations: GetCurrentSupportedAnnotationsFn;
  /**
   * Optional per-chart-type override forwarded to `getCurrentSupportedAnnotations`.
   * Return `false` to suppress an annotation type, `true` to force-include it, or
   * `undefined` to fall through to the default support filter.
   */
  isSupportedOverride?: ChartAnnotationSupportOverride;
  /**
   * The chart's own breakdown dimensions. Used for two things:
   *
   * 1. Combined with `chartFilter` to derive the announcement-targeting
   *    dimension set forwarded to `getCurrentSupportedAnnotations`, so
   *    Announcement annotations are kept only when they target a dimension the
   *    chart actually splits or filters by.
   * 2. Configured-alert incident annotations whose alert config doesn't carry
   *    a filter on at least one of these dimensions are hidden — keeping
   *    per-place / per-version alerts off charts that aren't split by that
   *    dimension.
   */
  chartBreakdown?: readonly TRAQIV2Dimension[];
  /**
   * The chart's own filter rows. Used for two things:
   *
   * 1. Combined with `chartBreakdown` to derive the announcement-targeting
   *    dimension set (see `chartBreakdown` above).
   * 2. Configured-alert incident annotations are kept only when their
   *    alert-config filter shares at least one row with this filter (matching
   *    dimension AND at least one value).
   */
  chartFilter?: readonly RAQIV2QueryFilter[];
};

/**
 * Project a `RAQIV2QueryFilter`'s `values` onto `readonly string[]`. Every
 * branch of the discriminated union — the `RAQIV2Dimension` rows and the
 * `RAQIV2UIPseudoDimension` (`PercentileType` / `AggregationType`) rows —
 * stores string-valued enums, so the conversion is type-safe by covariance
 * through `readonly` arrays. Centralising it here lets callers compare
 * filter values without sprinkling `as readonly string[]` casts.
 */
const filterValuesAsStrings = (filter: RAQIV2QueryFilter): readonly string[] => filter.values;

/**
 * Compare two value lists for set equality. Order- and duplicate-insensitive.
 * Used by the configured-alert filter-rule check to decide whether a chart
 * filter row's value set matches an annotation filter row's value set.
 */
const setEqual = (a: readonly string[], b: readonly string[]): boolean => {
  if (a.length !== b.length) {
    return false;
  }
  const setB = new Set(b);
  if (setB.size !== a.length) {
    // `b` had duplicates; compare against deduped `a` for parity.
    const setA = new Set(a);
    if (setA.size !== setB.size) {
      return false;
    }
    for (const v of setA) {
      if (!setB.has(v)) {
        return false;
      }
    }
    return true;
  }
  return a.every((v) => setB.has(v));
};

/**
 * Decide whether a `ConfiguredAlertIncident` annotation should be visible on
 * a chart with the given breakdown / filter context. Metric match is assumed
 * to have already been enforced upstream by `getCurrentSupportedAnnotations`.
 *
 * Algorithm:
 *
 * 1. Q1 short-circuit — chart has neither breakdown nor filter: SHOW.
 * 2. Q2 short-circuit — annotation is "global" (no filter rows AND no
 *    breakdown dimensions): SHOW on every metric-matching chart.
 * 3. Per-rule helpers:
 *    - `breakdownRulePasses`: at least one chart breakdown dimension also
 *      appears either as an annotation filter dimension (rule 3) or as an
 *      annotation breakdown dimension (Q4).
 *    - `filterRulePasses`: annotation has no filter rows (Q2 per-rule form),
 *      OR at least one chart filter row matches an annotation filter row by
 *      dimension AND exact value-set equality (Q3).
 * 4. Combinator:
 *    - chart has BOTH breakdown and filter → OR semantics (either rule
 *      passing is enough; see Shape D in the visibility doc).
 *    - chart has only breakdown → `breakdownRulePasses`.
 *    - chart has only filter → `filterRulePasses`.
 *
 * Exported for charts that don't fit the single-metric `useChartTimeSeriesAnnotations`
 * shape (e.g. `GenericRAQIV2MetricComparisonChart`) and want to apply the same
 * narrowing rule from their own annotations memo.
 */
export const shouldShowConfiguredAlertIncident = (
  annotation: TimeSeriesAnnotation & { type: AnnotationType.ConfiguredAlertIncident },
  chartBreakdown: readonly TRAQIV2Dimension[] | undefined,
  chartFilter: readonly RAQIV2QueryFilter[] | undefined,
): boolean => {
  const hasChartBreakdown = !!chartBreakdown?.length;
  const hasChartFilter = !!chartFilter?.length;

  // Q1: chart has no context → metric match is enough.
  if (!hasChartBreakdown && !hasChartFilter) {
    return true;
  }

  // Q2: annotation is "global" → relevant on every metric-matching chart.
  if (annotation.filter.length === 0 && annotation.breakdown.length === 0) {
    return true;
  }

  const breakdownRulePasses =
    hasChartBreakdown &&
    chartBreakdown.some(
      (dim) =>
        annotation.filter.some((row) => row.dimension === dim) ||
        annotation.breakdown.includes(dim),
    );

  const filterRulePasses =
    hasChartFilter &&
    (annotation.filter.length === 0 ||
      chartFilter.some((chartRow) => {
        const chartValues = filterValuesAsStrings(chartRow);
        return annotation.filter.some(
          (annRow) =>
            annRow.dimension === chartRow.dimension &&
            setEqual(filterValuesAsStrings(annRow), chartValues),
        );
      }));

  if (hasChartBreakdown && hasChartFilter) {
    // Q1 OR semantics: either rule passing is enough.
    return breakdownRulePasses || filterRulePasses;
  }
  if (hasChartBreakdown) {
    return breakdownRulePasses;
  }
  return filterRulePasses;
};

/**
 * Shared annotation-resolution logic for time-series RAQIV2 chart components.
 *
 * Centralises two concerns that have historically diverged across the
 * Spline/Area/StackedColumn/MetricComparison charts:
 *
 *   1. Driving the support filter with the deduped set of atomic source metrics
 *      so ComputedMetric-backed charts (user-defined ACE formulas, L7-smoothing
 *      wrappers) still get annotations.
 *   2. Exposing a single `metricForPerMetricTweaks` value charts can use to
 *      decide whether to apply per-metric annotation logic
 *      (DateRangeShifted shift, RetentionCorhortDisclaimer latest-data check,
 *      tooltip x-axis suppression) — defined for atomic metrics only, never
 *      picked arbitrarily from a multi-source formula.
 *
 * Each chart type supplies its own `isSupportedOverride` for chart-specific
 * rules (e.g. AreaChart blocks Benchmark unconditionally; SplineChartV2 also
 * predicates Benchmark on `hasSimilarityBenchmarks` and adds a
 * RetentionCorhortDisclaimer hide-when-data-current check).
 *
 * Charts can additionally pass `chartBreakdown` / `chartFilter` so configured
 * alert incident annotations are narrowed to ones whose alert config actually
 * applies to the chart's slice of the data.
 */
const useChartTimeSeriesAnnotations = ({
  metric,
  getCurrentSupportedAnnotations,
  isSupportedOverride,
  chartBreakdown,
  chartFilter,
}: UseChartTimeSeriesAnnotationsArgs): {
  timeSeriesAnnotations: TimeSeriesAnnotation[] | undefined;
  metricForPerMetricTweaks: TRAQIV2NumericUIMetric | undefined;
} => {
  const atomicMetricsForSupport = useMemo(() => getAtomicMetricsFromMetricLike(metric), [metric]);

  const metricForPerMetricTweaks = useMemo<TRAQIV2NumericUIMetric | undefined>(
    // Per-metric tweaks (DateRangeShifted, RetentionCorhortDisclaimer
    // latest-data check, tooltip x-axis suppression) only make sense for a
    // bare atomic numeric UI metric: ComputedMetric is multi-source, and
    // CustomEventsAtomicMetricLike is a wrapper object whose underlying
    // metric is `RAQIV2UIMetric.CustomEventsV2` (non-numeric).
    () => (typeof metric === 'string' && isNumericUIMetric(metric) ? metric : undefined),
    [metric],
  );

  // The chart's breakdown dimensions PLUS the dimensions referenced by its
  // filter rows, deduped. This is exactly the "dimensions this chart cares
  // about" set that announcement targeting wants. Returns `undefined` when
  // the chart has neither so `getCurrentSupportedAnnotations` falls back to
  // metric-only matching for Announcements (matching its arg-omitted
  // behaviour).
  const announcementTargetingDimensions = useMemo<readonly TRAQIV2Dimension[] | undefined>(() => {
    if (!chartBreakdown?.length && !chartFilter?.length) {
      return undefined;
    }
    const filterDims = chartFilter?.map(({ dimension }) => dimension) ?? [];
    return Array.from(new Set([...(chartBreakdown ?? []), ...filterDims]));
  }, [chartBreakdown, chartFilter]);

  // Explore Mode "Alerts" cascading sub-menu filter. Outside Explore
  // Mode the surrounding `ExploreModeAlertSelectionContext` is the default
  // value (`isExploreModeContext: false`, `selectedAlertIds: null`), so the
  // existing per-chart breakdown/filter rule below remains the only
  // constraint — non-Explore pages are unchanged.
  const { isExploreModeContext, selectedAlertIds: alertIdsAllowList } =
    useExploreModeAlertSelection();

  const timeSeriesAnnotations = useMemo(() => {
    if (!isNonEmptyArray(atomicMetricsForSupport)) {
      return [];
    }
    const supported = getCurrentSupportedAnnotations(
      atomicMetricsForSupport,
      isSupportedOverride,
      announcementTargetingDimensions,
    );
    // Preserve reference identity when no configured-alert incidents are
    // present so callers' downstream `useMemo` deps don't churn — and so the
    // existing identity-stability tests on this hook keep passing.
    if (
      !supported ||
      !supported.some((ann) => ann.type === AnnotationType.ConfiguredAlertIncident)
    ) {
      return supported;
    }
    return supported.filter((annotation) => {
      if (annotation.type !== AnnotationType.ConfiguredAlertIncident) {
        return true;
      }
      // Explore Mode bypasses the per-chart breakdown/filter rule for
      // configured-alert incidents entirely: the seed set of visible alert
      // ids is computed at the source (perf-)chart and forwarded via
      // `?annotation_alertId`, so re-applying the rule on the Explore
      // chart would double-narrow what the user is already meant to be
      // looking at.
      // Only the optional alert-id allow-list applies here.
      if (isExploreModeContext) {
        return alertIdsAllowList === null || alertIdsAllowList.has(annotation.alertId);
      }
      // Non-Explore pages: unchanged. The allow-list is always `null` here
      // (no provider mounted), so this short-circuits to today's behaviour.
      if (alertIdsAllowList !== null && !alertIdsAllowList.has(annotation.alertId)) {
        return false;
      }
      return shouldShowConfiguredAlertIncident(annotation, chartBreakdown, chartFilter);
    });
  }, [
    atomicMetricsForSupport,
    getCurrentSupportedAnnotations,
    isSupportedOverride,
    announcementTargetingDimensions,
    chartBreakdown,
    chartFilter,
    isExploreModeContext,
    alertIdsAllowList,
  ]);

  return useMemo(
    () => ({ timeSeriesAnnotations, metricForPerMetricTweaks }),
    [timeSeriesAnnotations, metricForPerMetricTweaks],
  );
};

export default useChartTimeSeriesAnnotations;
