import {
  RAQIV2Dimension,
  RAQIV2UIMetric,
  RAQIV2UIPseudoDimension,
} from '@rbx/creator-hub-analytics-config';
import type { RAQIV2QueryFilter } from '@modules/clients/analytics';
import {
  isChartConfiguratorMetric,
  type TChartConfiguratorMetrics,
} from '../../chartConfigurator/chartConfiguratorMetricsConfig';
import {
  updateFilterValues,
  type UIFilterDimension,
  type UIFilters,
} from '../../layout/ExperienceAnalyticsPageControlBar/filterUtils';
import {
  type AtomicMetricLike,
  type ComputedMetric,
  isCustomEventsAtomicMetricLike,
} from '../../types/ComputedMetric';
import extractPseudoDimensionsFromFilters, {
  hasPseudoDimensionValues,
} from '../../utils/extractPseudoDimensionsFromFilters';
import { customEventsMetric } from './useChartConfiguratorSourceSelection';

// Filters that are owned by an atomic metric's source identity in computed
// mode. CustomEventName picks the CustomEventsV2 source instance; the
// metric-fanout pseudo-dimensions (AggregationType, PercentileType, ...)
// pick the metric variant. Enumerate them explicitly so the strip/restore
// helpers do not depend on the codegen `RAQIV2DimensionDisplayConfig`
// metadata, which can be tricky to load in unit tests.
const SOURCE_OWNED_DIMENSIONS: ReadonlySet<UIFilterDimension> = new Set([
  RAQIV2Dimension.CustomEventName,
  RAQIV2UIPseudoDimension.AggregationType,
  RAQIV2UIPseudoDimension.PercentileType,
]);

/**
 * Strip page-level filters that are owned by the source's identity in
 * computed mode. This includes:
 *   - `CustomEventName` (lifted into `source.customEventName`)
 *   - All metric-fanout pseudo-dimensions (`AggregationType`,
 *     `PercentileType`, etc.) lifted into `source.pseudoDimensionValues`.
 *
 * Real query filters and unrelated UI dimensions are preserved.
 */
export function stripSourceOwnedFilters(filters: UIFilters): UIFilters {
  return filters.filter((filter) => !SOURCE_OWNED_DIMENSIONS.has(filter.dimension));
}

/**
 * Build the seeded `ComputedMetric` produced when toggling operations ON
 * over a current simple metric. Metric A mirrors the simple metric's
 * source identity (CustomEventName lifted onto a `CustomEventsAtomicMetricLike`,
 * remaining fanout pseudo-dimensions on `source.pseudoDimensionValues`).
 * Page-level filters that the source does not own are left in place —
 * the caller is responsible for stripping the migrated dimensions
 * afterwards via {@link stripSourceOwnedFilters}.
 */
export function buildSeededComputedMetricFromSimple(
  metric: TChartConfiguratorMetrics,
  filters: UIFilters,
  raqiFilters: readonly RAQIV2QueryFilter[] | undefined,
): ComputedMetric {
  const customEventName =
    metric === customEventsMetric
      ? (filters.find((f) => f.dimension === RAQIV2Dimension.CustomEventName)?.values?.[0] ?? null)
      : null;
  const { pseudoDimensionValues } = extractPseudoDimensionsFromFilters(raqiFilters);
  const includePseudo = hasPseudoDimensionValues(pseudoDimensionValues);
  // For CustomEventsV2 the AggregationType is part of the atomic metric's
  // source identity, not a per-source pseudo-dimension. Lift it onto the
  // atomic. PercentileType (and any future fanout dimensions not owned by
  // the atomic) stays on `source.pseudoDimensionValues`.
  const atomicMetric: AtomicMetricLike =
    customEventName && metric === customEventsMetric
      ? {
          metric: RAQIV2UIMetric.CustomEventsV2,
          customEventName,
          ...(pseudoDimensionValues.aggregationType
            ? { aggregationType: pseudoDimensionValues.aggregationType }
            : {}),
        }
      : metric;
  return {
    sources: [
      {
        key: 'A',
        metric: atomicMetric,
        ...(includePseudo ? { pseudoDimensionValues } : {}),
      },
    ],
    formula: 'A',
  };
}

/**
 * Simple-mode representation of a computed metric. Returned by
 * {@link collapseComputedMetricToSimple} when the formula is a single-source
 * identity over a supported Explore Mode metric and the source carries no
 * additional query filters.
 */
export type SimpleMetricCollapse = {
  metric: TChartConfiguratorMetrics;
  customEventName?: string;
  pseudoDimensionValues?: ComputedMetric['sources'][number]['pseudoDimensionValues'];
};

/**
 * Returns the simple-mode representation of a computed metric when its
 * formula is a single-source identity over a supported Explore Mode metric.
 *
 * Toggle-ON always seeds `formula: 'A'` over a single source, so any
 * computed metric the user did not manually rewrite round-trips through
 * this collapse. Multi-source or transformed formulas (e.g. `A+B`,
 * `A/2`) return `null` so the caller can clear computed mode without
 * inventing simple metric/filter state.
 */
export function collapseComputedMetricToSimple(
  computedMetric: ComputedMetric,
): SimpleMetricCollapse | null {
  if (computedMetric.sources.length !== 1) {
    return null;
  }
  const [source] = computedMetric.sources;
  if (computedMetric.formula.trim() !== source.key) {
    return null;
  }
  if (source.filters && source.filters.length > 0) {
    return null;
  }
  // Project the `AtomicMetricLike` back into a simple `(metric,
  // customEventName?, aggregationType?)` triple. The atomic owns
  // CustomEventName and (for CustomEventsV2) AggregationType; everything
  // else lives in `source.pseudoDimensionValues`.
  const sourceMetric = source.metric;
  const isCustomEvents = isCustomEventsAtomicMetricLike(sourceMetric);
  const baseMetric = isCustomEvents ? sourceMetric.metric : sourceMetric;
  if (!isChartConfiguratorMetric(baseMetric)) {
    return null;
  }
  const customEventName = isCustomEvents ? sourceMetric.customEventName : undefined;
  const liftedAggregationType = isCustomEvents ? sourceMetric.aggregationType : undefined;
  // If the atomic carries an aggregationType (CustomEventsV2 only), fold it
  // back into the collapsed pseudo-dimensions so the simple-mode URL
  // restores `filter_AggregationType` via {@link applyCollapseToFilters}.
  const sourcePseudo = source.pseudoDimensionValues;
  const mergedPseudo: ComputedMetric['sources'][number]['pseudoDimensionValues'] | undefined =
    liftedAggregationType
      ? {
          aggregationType: liftedAggregationType,
          percentile: sourcePseudo?.percentile ?? null,
        }
      : sourcePseudo;
  return {
    metric: baseMetric,
    ...(customEventName ? { customEventName } : {}),
    ...(mergedPseudo && hasPseudoDimensionValues(mergedPseudo)
      ? { pseudoDimensionValues: mergedPseudo }
      : {}),
  };
}

/**
 * Reapply a {@link SimpleMetricCollapse} to a page-level filter list.
 * Restores `filter_CustomEventName` and any metric-fanout pseudo-dimension
 * (e.g. `filter_AggregationType`, `filter_PercentileType`) that the source
 * carried so the URL representation of simple mode matches what computed
 * mode was rendering.
 */
export function applyCollapseToFilters(
  filters: UIFilters,
  collapse: SimpleMetricCollapse,
): UIFilters {
  let next = filters;
  if (collapse.customEventName) {
    next = updateFilterValues(next, RAQIV2Dimension.CustomEventName, [collapse.customEventName]);
  }
  const aggregationType = collapse.pseudoDimensionValues?.aggregationType;
  if (aggregationType) {
    next = updateFilterValues(next, RAQIV2UIPseudoDimension.AggregationType, [aggregationType]);
  }
  const percentile = collapse.pseudoDimensionValues?.percentile;
  if (percentile) {
    next = updateFilterValues(next, RAQIV2UIPseudoDimension.PercentileType, [percentile]);
  }
  return next;
}
