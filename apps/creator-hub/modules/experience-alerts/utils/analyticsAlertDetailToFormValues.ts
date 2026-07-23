import { RAQIV2MetricGranularity, type TRAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import logAnalyticsError from '@modules/charts-generic/utils/logAnalyticsError';
import { defaultExperienceAlertFormValues } from '../constants/alertFormConstants';
import {
  AnalyticsAlertEvaluationMode,
  type AnalyticsAlertDetail,
  type ExperienceAlertFilterRowValues,
  type ExperienceAlertFormValues,
} from '../constants/types';
import {
  analyticsIntervalFromMetricGranularity,
  comparisonPeriodFromPeriodOffset,
  formatAlertThresholdRawValueAsDisplay,
  isPseudoAlertDimension,
} from './analyticsAlertFormUtils';

/**
 * Converts a server-validated `AnalyticsAlertDetail` into the form-state shape used by
 * `ExperienceAlertForm`'s `defaultValues`, so that the configure (edit) page can rehydrate the
 * same alert configuration that was created via `buildCreateAnalyticsAlertRequest`.
 *
 * Filter and breakdown round-trip rule:
 *  - The API stores breakdown categories as a `filter` row whose dimension matches the
 *    breakdown dimension (see `buildCreateAnalyticsAlertRequest`'s intersection merge). When
 *    we read the alert back, those values belong in `breakdownCategories`, NOT in a filter
 *    row, so the form mirrors the user's original "breakdown by X, including these
 *    categories" intent rather than showing a redundant filter row.
 *  - Filter rows on every other dimension (including pseudo-dim percentile/aggregation rows
 *    that the response validator merges into `detail.filter`) become regular form filter rows.
 *  - The form does not allow combining a breakdown with a filter on a *different* real
 *    dimension, and the backend is expected to reject that shape, so receiving it here is a
 *    contract violation. We still surface the row as a filter (best-effort fallback) but log
 *    via Sentry so we notice if it ever happens in production.
 */
export default function analyticsAlertDetailToFormValues(
  detail: AnalyticsAlertDetail,
): ExperienceAlertFormValues {
  const breakdownDimension: TRAQIV2Dimension | null = detail.breakdown[0] ?? null;

  const breakdownCategories: string[] = [];
  const filters: ExperienceAlertFilterRowValues[] = [];
  detail.filter.forEach((row) => {
    if (breakdownDimension !== null && row.dimension === breakdownDimension) {
      breakdownCategories.push(...row.values);
      return;
    }
    if (breakdownDimension !== null && !isPseudoAlertDimension(row.dimension)) {
      logAnalyticsError(
        `analyticsAlertDetailToFormValues: alert "${detail.alertId}" has breakdown="${breakdownDimension}" but filter on a different real dimension "${row.dimension}"; backend should have rejected this shape.`,
      );
    }
    filters.push({ dimension: row.dimension, values: [...row.values] });
  });

  const interval = analyticsIntervalFromMetricGranularity(detail.granularity);

  // Fallback covers in-flight alerts whose condition was persisted before
  // `evaluationMode` was added to the contract; treat them as `Absolute`.
  const evaluationMode = detail.condition.evaluationMode ?? AnalyticsAlertEvaluationMode.Absolute;

  // Reverse-map the stored `periodOffsetMultiplier` back to the form's
  // comparison granularity unit. Only meaningful for period-over-period alerts
  // with a known interval; everything else (Absolute, or a missing interval
  // mapping) has no comparison unit, so it lands on `None` (the form default).
  const comparisonPeriod =
    evaluationMode === AnalyticsAlertEvaluationMode.PeriodOverPeriod && interval != null
      ? comparisonPeriodFromPeriodOffset(detail.condition.periodOffsetMultiplier, interval)
      : RAQIV2MetricGranularity.None;

  // The form's `value` field stores the *display* shape (what the user typed,
  // e.g. "5" for a 5% Percentage01 metric in Absolute mode, or "5" for a 5%
  // change in PoP mode regardless of metric) because `buildCondition` will
  // pass it back through `parseAlertThresholdDisplayValueToRaw` on save.
  // Seeding it with the raw API threshold here would double-apply the
  // inverse transform on every edit-save cycle (bug: 0.05 -> 0.0005 -> ...).
  const displayThreshold = formatAlertThresholdRawValueAsDisplay({
    metric: detail.metric,
    evaluationMode,
    rawValue: detail.condition.threshold,
  });

  return {
    ...defaultExperienceAlertFormValues(),
    name: detail.name,
    description: detail.description,
    metric: detail.metric,
    operation: detail.condition.operator,
    value: displayThreshold ?? String(detail.condition.threshold),
    evaluationMode,
    comparisonPeriod,
    filters,
    breakdownDimension,
    breakdownCategories,
    interval: interval ?? '',
    consecutiveOccurrences: detail.consecutiveOccurrences,
    severity: detail.severity,
    webhookConfigurationIds: [...detail.webhookConfigurationIds],
  };
}
