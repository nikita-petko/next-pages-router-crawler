import {
  RAQIV2AggregationType,
  RAQIV2PercentileType,
  RAQIV2UIPseudoDimension,
} from '@rbx/creator-hub-analytics-config';
import { isCustomEventsAtomicMetricLike } from '@modules/experience-analytics-shared/types/ComputedMetric';
import { getIsAverageAggregationMetric } from '@modules/experience-analytics-shared/utils/metricLikeSemantics';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import type { ChartAggregation, DashboardMetricReference } from '../types';

const AGGREGATION_PSEUDO_KEY: string = RAQIV2UIPseudoDimension.AggregationType;
const PERCENTILE_PSEUDO_KEY: string = RAQIV2UIPseudoDimension.PercentileType;

/**
 * Last-resort fallback when a metric reference cannot be resolved against
 * display config. Prefer {@link resolveDefaultChartAggregation} over this
 * constant — ordinary metrics default to Average via `defaultTotalSummaryTypes`.
 *
 * Temporary until DSA-5986 removes the backend requirement that charts send a
 * non-Invalid `data_spec.aggregation`.
 */
export const FALLBACK_CHART_AGGREGATION = RAQIV2AggregationType.Average;

function aggregationFromVariantSelections(
  reference: DashboardMetricReference,
): ChartAggregation | undefined {
  for (const selection of reference.variantSelections ?? []) {
    if (
      selection.pseudoDimensionKey === AGGREGATION_PSEUDO_KEY &&
      isValidEnumValue(RAQIV2AggregationType, selection.variantKey)
    ) {
      return selection.variantKey;
    }
    if (
      selection.pseudoDimensionKey === PERCENTILE_PSEUDO_KEY &&
      isValidEnumValue(RAQIV2PercentileType, selection.variantKey)
    ) {
      return selection.variantKey;
    }
  }
  return undefined;
}

/**
 * Resolves the chart `dataSpec.aggregation` the backend currently requires.
 *
 * Prefer, in order:
 * 1. Explicit fanout variant on the metric reference (custom-event aggregation /
 *    percentile)
 * 2. Custom-events atomic `aggregationType` on a computed-metric source
 * 3. Metric display config via {@link getIsAverageAggregationMetric} (Average for
 *    rates/retention/DAU; Sum only when configured for Total rollup)
 *
 * TODO(DSA-5986): remove once backend stops requiring chart aggregation.
 */
export function resolveDefaultChartAggregation(
  reference: DashboardMetricReference,
): ChartAggregation {
  const fromVariant = aggregationFromVariantSelections(reference);
  if (fromVariant !== undefined) {
    return fromVariant;
  }

  if (reference.computedMetric) {
    const [firstSource] = reference.computedMetric.sources;
    if (firstSource && isCustomEventsAtomicMetricLike(firstSource.metric)) {
      return firstSource.metric.aggregationType ?? RAQIV2AggregationType.Sum;
    }
    return FALLBACK_CHART_AGGREGATION;
  }

  if (reference.metricKey !== undefined) {
    return getIsAverageAggregationMetric(reference.metricKey)
      ? RAQIV2AggregationType.Average
      : RAQIV2AggregationType.Sum;
  }

  return FALLBACK_CHART_AGGREGATION;
}
