import {
  RAQIV2MetricGranularity,
  RAQIV2MetricToSupportedGranularities,
} from '@rbx/creator-hub-analytics-config';
import type { TRAQIV2UIMetric } from '@rbx/creator-hub-analytics-config';
import { CustomDashboardSummaryCardAggregation, type SummaryCardAggregation } from '../types';

export const SUMMARY_CARD_TIME_SERIES_GRANULARITY = RAQIV2MetricGranularity.OneDay;

export function getSummaryCardAggregationGranularity(
  aggregation: SummaryCardAggregation,
): RAQIV2MetricGranularity {
  return aggregation === CustomDashboardSummaryCardAggregation.Cumulative
    ? RAQIV2MetricGranularity.None
    : SUMMARY_CARD_TIME_SERIES_GRANULARITY;
}

export function isSummaryCardAggregationSupported(
  metric: TRAQIV2UIMetric,
  aggregation: SummaryCardAggregation,
): boolean {
  return RAQIV2MetricToSupportedGranularities[metric].includes(
    getSummaryCardAggregationGranularity(aggregation),
  );
}

export function resolveSupportedSummaryCardAggregation(
  metric: TRAQIV2UIMetric,
  aggregation: SummaryCardAggregation,
): SummaryCardAggregation | null {
  if (isSummaryCardAggregationSupported(metric, aggregation)) {
    return aggregation;
  }
  if (
    isSummaryCardAggregationSupported(
      metric,
      CustomDashboardSummaryCardAggregation.AverageOverTimePeriod,
    )
  ) {
    return CustomDashboardSummaryCardAggregation.AverageOverTimePeriod;
  }
  if (isSummaryCardAggregationSupported(metric, CustomDashboardSummaryCardAggregation.Cumulative)) {
    return CustomDashboardSummaryCardAggregation.Cumulative;
  }
  return null;
}
