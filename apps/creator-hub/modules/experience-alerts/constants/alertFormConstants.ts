import { RAQIV2MetricGranularity, RAQIV2Severity } from '@rbx/creator-hub-analytics-config';
import type { TranslationKey } from '@modules/analytics-translations/types';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import {
  AnalyticsAlertConditionOperator,
  AnalyticsAlertEvaluationMode,
  AnalyticsAlertSeverity,
  type ExperienceAlertFormValues,
} from './types';

export const ALERT_CONDITION_OPERATION_SYMBOLS: Record<AnalyticsAlertConditionOperator, string> = {
  [AnalyticsAlertConditionOperator.Lt]: '<',
  [AnalyticsAlertConditionOperator.Lte]: '<=',
  [AnalyticsAlertConditionOperator.Gt]: '>',
  [AnalyticsAlertConditionOperator.Gte]: '>=',
};

/** Dropdown order; derived from symbol keys so new enum values require a symbol entry here (exhaustive Record). */
export const ALERT_CONDITION_OPERATION_MENU_ORDER: AnalyticsAlertConditionOperator[] = [
  AnalyticsAlertConditionOperator.Lt,
  AnalyticsAlertConditionOperator.Lte,
  AnalyticsAlertConditionOperator.Gt,
  AnalyticsAlertConditionOperator.Gte,
];

/**
 * Translation keys for the evaluation-mode dropdown in the trigger-condition row.
 * Exhaustive Record so any new enum value forces a label entry here.
 */
export const ALERT_EVALUATION_MODE_LABEL_KEYS: Record<
  AnalyticsAlertEvaluationMode,
  TranslationKey
> = {
  [AnalyticsAlertEvaluationMode.Absolute]: translationKey(
    'Label.MetricValue',
    TranslationNamespace.ExperienceAlerts,
  ),
  [AnalyticsAlertEvaluationMode.PeriodOverPeriod]: translationKey(
    'Label.PeriodOverPeriod',
    TranslationNamespace.ExperienceAlerts,
  ),
};

/**
 * Secondary descriptions for the evaluation-mode dropdown options, rendered as
 * the `MenuItem` `description` beneath each label. Exhaustive Record so any new
 * enum value forces a description entry here.
 */
export const ALERT_EVALUATION_MODE_DESCRIPTION_KEYS: Record<
  AnalyticsAlertEvaluationMode,
  TranslationKey
> = {
  [AnalyticsAlertEvaluationMode.Absolute]: translationKey(
    'Description.MetricValueEvaluationMode',
    TranslationNamespace.ExperienceAlerts,
  ),
  [AnalyticsAlertEvaluationMode.PeriodOverPeriod]: translationKey(
    'Description.PeriodOverPeriodEvaluationMode',
    TranslationNamespace.ExperienceAlerts,
  ),
};

/** Dropdown order; derived from label-key entries so new enum values require a label entry here. */
export const ALERT_EVALUATION_MODE_MENU_ORDER: AnalyticsAlertEvaluationMode[] = [
  AnalyticsAlertEvaluationMode.Absolute,
  AnalyticsAlertEvaluationMode.PeriodOverPeriod,
];

/**
 * Granularity "units" the period-over-period "Comparison period" dropdown can
 * offer, smallest bucket first (drives dropdown order). Each entry is expressed
 * as a granularity whose bucket length is the comparison offset (e.g. `OneHour`
 * -> "hour over hour", compare against one hour earlier). `OneMonth` and `None`
 * are intentionally excluded. The options actually shown are narrowed further to
 * the metric's supported granularities and to those >= the selected alert
 * interval — see `getComparisonPeriodGranularityOptions`.
 *
 * This is the single source of truth; the {@link ComparisonPeriodGranularity}
 * union is derived from it.
 */
export const COMPARISON_PERIOD_GRANULARITIES = [
  RAQIV2MetricGranularity.OneMinute,
  RAQIV2MetricGranularity.HalfHour,
  RAQIV2MetricGranularity.OneHour,
  RAQIV2MetricGranularity.OneDay,
  RAQIV2MetricGranularity.OneWeek,
] as const;

export type ComparisonPeriodGranularity = (typeof COMPARISON_PERIOD_GRANULARITIES)[number];

/** Narrowing guard for the comparison-period unit set. */
export const isComparisonPeriodGranularity = (
  granularity: RAQIV2MetricGranularity,
): granularity is ComparisonPeriodGranularity =>
  (COMPARISON_PERIOD_GRANULARITIES as readonly RAQIV2MetricGranularity[]).includes(granularity);

/**
 * Translation keys for each "X over X" comparison-period option, keyed by the
 * comparison granularity. Exhaustive `Record` so any new unit forces an entry
 * here.
 */
export const ALERT_COMPARISON_PERIOD_LABELS: Record<ComparisonPeriodGranularity, TranslationKey> = {
  [RAQIV2MetricGranularity.OneMinute]: translationKey(
    'Label.MinuteOverMinute',
    TranslationNamespace.ExperienceAlerts,
  ),
  [RAQIV2MetricGranularity.HalfHour]: translationKey(
    'Label.HalfHourOverHalfHour',
    TranslationNamespace.ExperienceAlerts,
  ),
  [RAQIV2MetricGranularity.OneHour]: translationKey(
    'Label.HourOverHour',
    TranslationNamespace.ExperienceAlerts,
  ),
  [RAQIV2MetricGranularity.OneDay]: translationKey(
    'Label.DayOverDay',
    TranslationNamespace.ExperienceAlerts,
  ),
  [RAQIV2MetricGranularity.OneWeek]: translationKey(
    'Label.WeekOverWeek',
    TranslationNamespace.ExperienceAlerts,
  ),
};

/** Sentinel value for Foundation Dropdown when no dimension is selected */
export const ALERT_FORM_NONE_DIMENSION = '$__NONE__$';

/**
 * Frontend mirror of the analytics-alert-control-plane `MaxAlertsPerResource`
 * cap (analytics-alerts PR #99). When the configured count of alerts on a
 * universe reaches this value, the API returns
 * {@link AnalyticsAlertErrorCode.MaxAlertReached} on create; the dashboard
 * uses the same constant to gray out the "Create" affordance proactively so
 * the user gets immediate feedback before they fill out the form.
 */
export const MAX_ALERTS_PER_RESOURCE = 20;

/**
 * Minimum `consecutiveOccurrences` value the form accepts when the alert is
 * configured at minute granularity. At one-minute buckets the stored
 * wall-clock duration is `(consecutiveOccurrences - 1) * 1`, so this floor
 * means the alert won't fire until the condition has held for at least
 * `MIN_CONSECUTIVE_OCCURRENCES_FOR_MINUTE_GRANULARITY - 1` minutes —
 * filtering out single-point spikes that would otherwise be noisy at the
 * highest-resolution interval. Other intervals (half-hour and above) have no
 * such floor and only require the global `consecutiveOccurrences >= 1`
 * minimum the API enforces.
 */
export const MIN_CONSECUTIVE_OCCURRENCES_FOR_MINUTE_GRANULARITY = 6;

/**
 * Maximum `consecutiveOccurrences` value the form accepts when the alert is
 * configured at minute granularity. Caps the wall-clock evaluation window to
 * `(MAX - 1) * 1` minutes so users don't accidentally configure an alert that
 * silently waits hours before firing at the highest-resolution interval.
 */
export const MAX_CONSECUTIVE_OCCURRENCES_FOR_MINUTE_GRANULARITY = 30;

/**
 * Maximum `consecutiveOccurrences` value the form accepts at every non-minute
 * granularity (half-hour and above). Caps the wall-clock evaluation window
 * to `(MAX - 1) * step` of the selected granularity, which keeps the firing
 * latency understandable for the user.
 */
export const MAX_CONSECUTIVE_OCCURRENCES_FOR_OTHER_GRANULARITY = 10;

/** Length of one data bucket for each granularity, in minutes (month uses a 30-day estimate). */
export function getAlertGranularityStepMinutes(granularity: RAQIV2MetricGranularity): number {
  switch (granularity) {
    case RAQIV2MetricGranularity.OneMinute:
      return 1;
    case RAQIV2MetricGranularity.HalfHour:
      return 30;
    case RAQIV2MetricGranularity.OneHour:
      return 60;
    case RAQIV2MetricGranularity.OneDay:
      return 1440; // 24 * 60
    case RAQIV2MetricGranularity.OneWeek:
      return 10080; // 7 * 24 * 60
    case RAQIV2MetricGranularity.OneMonth:
      return 43200; // 30 * 24 * 60
    case RAQIV2MetricGranularity.None:
      return 0;
    default: {
      const exhaustive: never = granularity;
      throw new Error(`Unhandled granularity ${String(exhaustive)}`);
    }
  }
}

export const defaultExperienceAlertFormValues = (): ExperienceAlertFormValues => ({
  name: '',
  description: '',
  metric: null,
  operation: AnalyticsAlertConditionOperator.Gt,
  value: '',
  evaluationMode: AnalyticsAlertEvaluationMode.Absolute,
  // No comparison unit until a granularity is selected; the form seeds this to
  // the chosen granularity (one interval back) once the user picks one.
  comparisonPeriod: RAQIV2MetricGranularity.None,
  filters: [],
  breakdownDimension: null,
  breakdownCategories: [],
  interval: '',
  consecutiveOccurrences: '',
  severity: AnalyticsAlertSeverity.SEV_1,
  webhookConfigurationIds: [],
});

export function analyticsAlertSeverityTranslationKey(
  severity: AnalyticsAlertSeverity,
): TranslationKey {
  switch (severity) {
    case AnalyticsAlertSeverity.SEV_0:
      return translationKey('Severity.Critical', TranslationNamespace.ExperienceAlerts);
    case AnalyticsAlertSeverity.SEV_1:
      return translationKey('Severity.Medium', TranslationNamespace.ExperienceAlerts);
    case AnalyticsAlertSeverity.SEV_2:
      return translationKey('Severity.Low', TranslationNamespace.ExperienceAlerts);
    default: {
      const exhaustiveCheck: never = severity;
      throw new Error(`Unhandled severity: ${String(exhaustiveCheck)}`);
    }
  }
}

/**
 * Maps the RAQI Severity dimension's string values (`'SEV_0' | 'SEV_1' | 'SEV_2'`,
 * the form filter bar emits) to the `AnalyticsAlertSeverity` enum that the
 * Analytics Alert API consumes (wire values `"SEV_0"` / `"SEV_1"` / `"SEV_2"`).
 * Exhaustive `Record` so any future `RAQIV2Severity` addition forces an entry here.
 */
const RAQIV2_SEVERITY_TO_ANALYTICS_ALERT_SEVERITY: Record<RAQIV2Severity, AnalyticsAlertSeverity> =
  {
    [RAQIV2Severity.SEV_0]: AnalyticsAlertSeverity.SEV_0,
    [RAQIV2Severity.SEV_1]: AnalyticsAlertSeverity.SEV_1,
    [RAQIV2Severity.SEV_2]: AnalyticsAlertSeverity.SEV_2,
  };

/**
 * Converts an array of raw filter-bar string values for the `RAQIV2Dimension.Severity`
 * dimension into `AnalyticsAlertSeverity` enum values. Unrecognized values are dropped
 * so a stale URL param can't crash the request.
 */
export function raqiSeverityFilterValuesToAnalyticsAlertSeverities(
  rawValues: readonly string[],
): AnalyticsAlertSeverity[] {
  return rawValues.flatMap((value) =>
    isValidEnumValue(RAQIV2Severity, value)
      ? [RAQIV2_SEVERITY_TO_ANALYTICS_ALERT_SEVERITY[value]]
      : [],
  );
}
