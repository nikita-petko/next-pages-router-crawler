import {
  RAQIV2Metric,
  RAQIV2MetricDisplayConfig,
  RAQIV2MetricToSupportedGranularities,
  RAQIV2MetricToAlertingEligibleDimensions,
  RAQIV2MetricGranularity,
  RAQIV2MetricUnit,
  RAQIV2UIMetric,
  RAQIV2UIPseudoDimension,
  type TRAQIV2APIMetric,
  type TRAQIV2Dimension,
} from '@rbx/creator-hub-analytics-config';
import type {
  TranslationKey,
  TranslationKeyToFormattedText,
} from '@modules/analytics-translations/types';
import { NumberContext } from '@modules/charts-generic/charts/numberFormatters';
import type {
  AnalyticsQueryGatewayAPIBreakdownValue as RAQIV2BreakdownValue,
  AnalyticsQueryGatewayAPIMetricValue as RAQIV2MetricValue,
} from '@modules/clients/analytics/analyticsQueryGateway';
import { getSingleDimensionBreakdownLabel } from '@modules/experience-analytics-shared/adapters/genericRAQIV2ChartAdapter';
import {
  isNumericUIMetric,
  type TRAQIV2NumericUIMetric,
} from '@modules/experience-analytics-shared/constants/AnalyticsMetricDisplayConfig';
import getAnalyticsMetricDisplayConfig from '@modules/experience-analytics-shared/constants/AnalyticsMetricDisplayConfig';
import { getFilterBarDimensionForRAQIV2Dimension } from '@modules/experience-analytics-shared/constants/FilterDimensionConfig';
import type { RAQIV2TranslationDependencies } from '@modules/experience-analytics-shared/types/RAQIV2DimensionRenderer';
import formatAnalyticsNumber from '@modules/experience-analytics-shared/utils/analyticsNumberFormatter';
import {
  MetricUnitDefaultSuffix,
  generateAnalyticsNumberFormattingSpec,
} from '@modules/experience-analytics-shared/utils/analyticsNumberFormattingSpec';
import { getAPIMetricFromUIMetric } from '@modules/experience-analytics-shared/utils/getAPIMetricFromUIMetric';
import { getUIMetric } from '@modules/experience-analytics-shared/utils/getUIMetric';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import {
  ALERT_CONDITION_OPERATION_SYMBOLS,
  COMPARISON_PERIOD_GRANULARITIES,
  getAlertGranularityStepMinutes,
  type ComparisonPeriodGranularity,
} from '../constants/alertFormConstants';
import {
  AnalyticsAlertInterval,
  AnalyticsAlertConditionOperator,
  AnalyticsAlertEvaluationMode,
  type AnalyticsAlertCondition,
  type AnalyticsAlertFiringMetadata,
  type TAlertConditionMetric,
} from '../constants/types';
import {
  applyDataPointInverseTransform,
  formatAnalyticsMetricRawValueAsDisplay,
  parseAnalyticsMetricDisplayValueToRaw,
} from './parseAnalyticsMetricDisplayValue';

const MINUTES_PER_DAY = 1440;

const ALERT_INTERVAL_TO_GRANULARITY: Record<AnalyticsAlertInterval, RAQIV2MetricGranularity> = {
  [AnalyticsAlertInterval.OneMinute]: RAQIV2MetricGranularity.OneMinute,
  [AnalyticsAlertInterval.HalfHour]: RAQIV2MetricGranularity.HalfHour,
  [AnalyticsAlertInterval.OneHour]: RAQIV2MetricGranularity.OneHour,
  [AnalyticsAlertInterval.OneDay]: RAQIV2MetricGranularity.OneDay,
};

const GRANULARITY_TO_ALERT_INTERVAL: Partial<
  Record<RAQIV2MetricGranularity, AnalyticsAlertInterval>
> = Object.values(AnalyticsAlertInterval).reduce<
  Partial<Record<RAQIV2MetricGranularity, AnalyticsAlertInterval>>
>((acc, interval) => {
  acc[ALERT_INTERVAL_TO_GRANULARITY[interval]] = interval;
  return acc;
}, {});

export function metricGranularityFromAnalyticsInterval(
  interval: AnalyticsAlertInterval,
): RAQIV2MetricGranularity {
  return ALERT_INTERVAL_TO_GRANULARITY[interval];
}

export function analyticsIntervalFromMetricGranularity(
  granularity: RAQIV2MetricGranularity,
): AnalyticsAlertInterval | undefined {
  return GRANULARITY_TO_ALERT_INTERVAL[granularity];
}

/**
 * Converts the form's `comparisonPeriod` granularity unit into the API's
 * `condition.periodOffsetMultiplier` for the selected `interval`.
 *
 * The multiplier scales the interval up to the comparison offset
 * (`comparisonStepMinutes / intervalStepMinutes`). The comparison unit is
 * always >= the interval (see {@link getComparisonPeriodGranularityOptions}),
 * and every alert-eligible interval (1m/30m/1h/1d) divides each comparison
 * unit's bucket evenly, so the result is always a whole number >= 1. When the
 * comparison unit equals the selected granularity the multiplier is `1` (one
 * interval back, the API default). Guards against a zero/`None`/too-small step
 * by falling back to `1`.
 */
export function computePeriodOffsetMultiplier(
  interval: AnalyticsAlertInterval,
  comparisonPeriod: RAQIV2MetricGranularity,
): number {
  const intervalStep = getAlertGranularityStepMinutes(
    metricGranularityFromAnalyticsInterval(interval),
  );
  const comparisonStep = getAlertGranularityStepMinutes(comparisonPeriod);
  if (intervalStep <= 0 || comparisonStep < intervalStep) {
    return 1;
  }
  return comparisonStep / intervalStep;
}

/**
 * Inverse of {@link computePeriodOffsetMultiplier}: derives the comparison
 * granularity a stored `periodOffsetMultiplier` represents at the given
 * `interval`. A missing or sub-1 value is normalized to `1` (matching the API's
 * `EffectivePeriodOffsetMultiplier`). The comparison offset
 * (`multiplier * intervalStepMinutes`) is matched against the offered unit
 * buckets; anything that doesn't line up exactly (including the API default of
 * `1`) falls back to the selected granularity itself (one interval back).
 */
export function comparisonPeriodFromPeriodOffset(
  periodOffsetMultiplier: number | null | undefined,
  interval: AnalyticsAlertInterval,
): RAQIV2MetricGranularity {
  const multiplier =
    periodOffsetMultiplier != null && periodOffsetMultiplier >= 1 ? periodOffsetMultiplier : 1;
  const intervalGranularity = metricGranularityFromAnalyticsInterval(interval);
  const offsetMinutes = multiplier * getAlertGranularityStepMinutes(intervalGranularity);
  const matched = COMPARISON_PERIOD_GRANULARITIES.find(
    (granularity) => getAlertGranularityStepMinutes(granularity) === offsetMinutes,
  );
  return matched ?? intervalGranularity;
}

/**
 * Period-over-period comparison units ({@link COMPARISON_PERIOD_GRANULARITIES})
 * offered for the given metric and alert `interval`, smallest-first. A unit is
 * offered when it is >= the selected interval and its comparison offset
 * (`offset + one interval`) stays within the metric's `retentionDurationDays`,
 * mirroring the control plane's `ValidatePeriodOffsetRetention`.
 */
export function getComparisonPeriodGranularityOptions(
  metric: TAlertConditionMetric,
  interval: AnalyticsAlertInterval,
): ComparisonPeriodGranularity[] {
  const intervalStep = getAlertGranularityStepMinutes(
    metricGranularityFromAnalyticsInterval(interval),
  );
  const retentionMinutes =
    RAQIV2MetricDisplayConfig[metric].retentionDurationDays * MINUTES_PER_DAY;
  return COMPARISON_PERIOD_GRANULARITIES.filter((granularity) => {
    const comparisonStep = getAlertGranularityStepMinutes(granularity);
    return comparisonStep >= intervalStep && comparisonStep + intervalStep <= retentionMinutes;
  });
}

export function analyticsIntervalOptionsForMetric(
  metric: TAlertConditionMetric,
): AnalyticsAlertInterval[] {
  const supported = RAQIV2MetricToSupportedGranularities[metric];
  if (!supported?.length) {
    return [];
  }
  return Object.values(AnalyticsAlertInterval).filter((interval) =>
    supported.includes(metricGranularityFromAnalyticsInterval(interval)),
  );
}

/**
 * UI pseudo-metrics that are alert-eligible per the generated config but that we
 * deliberately do not surface as their own option in the alert form, mapped to
 * the canonical metric that supersedes them.
 *
 * `ServerMemoryUsageByServerAge` and `ServerMemoryUsageV2` are two distinct UI
 * pseudo-metrics that back the identical `MemoryUsageAvg`/percentile API
 * metrics. The only thing distinguishing the by-age variant is a forced
 * `ServerAgeBucket` breakdown in explore mode — and `ServerAgeBucket` is not
 * alert-eligible — so as an alert the two are indistinguishable. We expose only
 * `ServerMemoryUsageV2` to avoid a confusing duplicate option.
 *
 * Note `getUIMetric` reverse-resolves a shared API metric to the *first*
 * matching UI metric, which for server memory is the by-age variant; the alert
 * response path uses {@link resolveCanonicalAlertMetric} so stored alerts
 * round-trip onto the option that's actually selectable here.
 */
const ALERT_HIDDEN_METRIC_TO_CANONICAL: Partial<
  Record<TRAQIV2NumericUIMetric, TRAQIV2NumericUIMetric>
> = {
  [RAQIV2UIMetric.ServerMemoryUsageByServerAge]: RAQIV2UIMetric.ServerMemoryUsageV2,
};

/**
 * Remaps a UI metric that we hide from the alert form (see
 * {@link ALERT_HIDDEN_METRIC_TO_CANONICAL}) to its canonical, selectable
 * equivalent; returns the metric unchanged when it isn't hidden.
 */
export const resolveCanonicalAlertMetric = (
  metric: TRAQIV2NumericUIMetric,
): TRAQIV2NumericUIMetric => ALERT_HIDDEN_METRIC_TO_CANONICAL[metric] ?? metric;

export const getAlertEligibleMetrics = (): TRAQIV2NumericUIMetric[] =>
  [...Object.values(RAQIV2Metric), ...Object.values(RAQIV2UIMetric)]
    .filter(
      (m): m is TRAQIV2NumericUIMetric =>
        RAQIV2MetricDisplayConfig[m].isEligibleForAlerting === true &&
        isNumericUIMetric(m) &&
        ALERT_HIDDEN_METRIC_TO_CANONICAL[m] == null,
    )
    .sort((a, b) => a.localeCompare(b));

export const uiAlertMetricToApiMetrics = (metric: TAlertConditionMetric): TRAQIV2APIMetric[] => {
  if (isValidEnumValue(RAQIV2Metric, metric)) {
    return [metric];
  }
  return [getAPIMetricFromUIMetric(metric, { percentile: null, aggregationType: null })];
};

export const getConditionValueUnitDisplay = (
  metric: TAlertConditionMetric | null,
  translate: (key: TranslationKey) => string,
): string => {
  if (!metric) {
    return '';
  }
  const metricDisplayConfig = RAQIV2MetricDisplayConfig[metric];
  const { unit } = metricDisplayConfig;
  if (unit === RAQIV2MetricUnit.Percentage01 || unit === RAQIV2MetricUnit.Percentage0100) {
    return '%';
  }
  const suffixKey =
    metricDisplayConfig.suffix?.short ??
    MetricUnitDefaultSuffix[metricDisplayConfig.unit]?.defaultSuffix;
  return suffixKey ? translate(suffixKey) : '';
};

/**
 * Period-over-period thresholds are interpreted as relative percent changes
 * regardless of the underlying metric: the user types `5` to mean "5%
 * change from the previous period" and the API receives `0.05`. These
 * helpers centralize that branch so the form input, the API builder, and
 * the response renderer all agree on the same display <-> raw mapping.
 *
 * The Absolute branch falls through to the data-point pipeline (so e.g.
 * `5` for a Percentage01 metric also maps to `0.05`, but driven by the
 * metric's display config rather than a fixed `/100`).
 */
const PERIOD_OVER_PERIOD_PERCENT_DIVISOR = 100;

/**
 * IEEE 754 double-precision floats have ~15.95 significant decimal digits, so 15 is the
 * highest precision at which round-tripping through `Number(value.toPrecision(...))`
 * still drops the spurious low-bit noise from float multiplication while preserving
 * legitimate user input.
 */
const FLOAT_PRECISION_DIGITS = 15;

/** Cleans up float multiplication artifacts (e.g. `0.05 * 100 === 5.000000000000001`). */
const cleanFloatArtifact = (value: number): number =>
  Number(value.toPrecision(FLOAT_PRECISION_DIGITS));

const parsePeriodOverPeriodDisplayValueToRaw = (displayValue: string): number | null => {
  const trimmed = displayValue.trim();
  // Accept an optional trailing `%` so the user can type either "5" or "5%"
  // (the trailing-icon hint shows `%`, both feel natural).
  const stripped = trimmed.endsWith('%') ? trimmed.slice(0, -1).trimEnd() : trimmed;
  if (stripped === '') {
    return null;
  }
  const parsed = Number.parseFloat(stripped);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return parsed / PERIOD_OVER_PERIOD_PERCENT_DIVISOR;
};

const formatPeriodOverPeriodRawValueAsDisplay = (rawValue: number): string | null => {
  if (!Number.isFinite(rawValue)) {
    return null;
  }
  return String(cleanFloatArtifact(rawValue * PERIOD_OVER_PERIOD_PERCENT_DIVISOR));
};

/** Max decimal places allowed in the typed PoP threshold (e.g. `0.01%`). */
const PERIOD_OVER_PERIOD_MAX_DECIMAL_PLACES = 2;

/**
 * Maximum decimal places allowed in the threshold input for a given metric
 * and evaluation mode. Used by the form's `value` validator.
 *
 * - `PeriodOverPeriod` is fixed at {@link PERIOD_OVER_PERIOD_MAX_DECIMAL_PLACES}
 *   (relative-change semantics, independent of the metric).
 * - `Absolute` uses `numberFormatOptions.maximumFractionDigits` from
 *   {@link generateAnalyticsNumberFormattingSpec} under
 *   {@link NumberContext.DataPoint}, falling back to `0` if absent. For
 *   percent-style metrics this matches what the user sees in the field —
 *   `Intl`'s percent style applies fraction digits *after* the implicit
 *   `*100`, so a `decimalPrecision: 2` Percentage01 metric displays
 *   `12.34%` and accepts at most 2 fractional digits in the typed string.
 */
export const getAlertThresholdMaxDecimalPlaces = ({
  metric,
  evaluationMode,
}: {
  metric: TAlertConditionMetric;
  evaluationMode: AnalyticsAlertEvaluationMode;
}): number => {
  if (evaluationMode === AnalyticsAlertEvaluationMode.PeriodOverPeriod) {
    return PERIOD_OVER_PERIOD_MAX_DECIMAL_PLACES;
  }
  const spec = generateAnalyticsNumberFormattingSpec({
    metric,
    context: NumberContext.DataPoint,
  });
  return spec.numberFormatOptions.maximumFractionDigits ?? 0;
};

/**
 * Number of digits after the decimal point in a typed threshold input.
 * Strips a single optional trailing `%` so `1.23%` and `1.23` agree. Pure
 * string-shape check — does not parse or validate the number itself (the
 * form's `parsesAsNumber` validator owns parseability).
 *
 * Examples: `"12"` -> 0, `"12.50"` -> 2, `"12."` -> 0, `"  3.14% "` -> 2.
 */
export const countDisplayValueDecimalPlaces = (displayValue: string): number => {
  const trimmed = displayValue.trim();
  const stripped = trimmed.endsWith('%') ? trimmed.slice(0, -1).trimEnd() : trimmed;
  const dotIndex = stripped.lastIndexOf('.');
  if (dotIndex === -1) {
    return 0;
  }
  return stripped.length - dotIndex - 1;
};

/**
 * Evaluation-mode-aware wrapper around {@link parseAnalyticsMetricDisplayValueToRaw}:
 * - `PeriodOverPeriod` always treats the input as a percent change (`5` -> `0.05`),
 *   independent of the metric's display config.
 * - `Absolute` delegates to the data-point pipeline so the same value the user
 *   sees in a spline-chart tooltip round-trips through the API.
 */
export const parseAlertThresholdDisplayValueToRaw = ({
  metric,
  evaluationMode,
  displayValue,
}: {
  metric: TAlertConditionMetric;
  evaluationMode: AnalyticsAlertEvaluationMode;
  displayValue: string;
}): number | null => {
  if (evaluationMode === AnalyticsAlertEvaluationMode.PeriodOverPeriod) {
    return parsePeriodOverPeriodDisplayValueToRaw(displayValue);
  }
  return parseAnalyticsMetricDisplayValueToRaw({ metric, displayValue });
};

/**
 * Inverse of {@link parseAlertThresholdDisplayValueToRaw}: turns the raw API
 * threshold back into the user-typed display string for the form's value
 * field. PoP always renders as `raw * 100` (so `0.05` -> `"5"`).
 */
export const formatAlertThresholdRawValueAsDisplay = ({
  metric,
  evaluationMode,
  rawValue,
}: {
  metric: TAlertConditionMetric;
  evaluationMode: AnalyticsAlertEvaluationMode;
  rawValue: number;
}): string | null => {
  if (evaluationMode === AnalyticsAlertEvaluationMode.PeriodOverPeriod) {
    return formatPeriodOverPeriodRawValueAsDisplay(rawValue);
  }
  return formatAnalyticsMetricRawValueAsDisplay({ metric, rawValue });
};

/**
 * Trailing-unit hint shown next to the threshold input in the trigger-condition
 * row. PoP always renders as `%` (relative-change semantics); Absolute falls
 * through to {@link getConditionValueUnitDisplay} for the metric-driven unit.
 */
export const getAlertThresholdUnitDisplay = (
  metric: TAlertConditionMetric | null,
  evaluationMode: AnalyticsAlertEvaluationMode,
  translate: (key: TranslationKey) => string,
): string => {
  if (evaluationMode === AnalyticsAlertEvaluationMode.PeriodOverPeriod) {
    return '%';
  }
  return getConditionValueUnitDisplay(metric, translate);
};

export const isPseudoAlertDimension = (dimension: TRAQIV2Dimension): boolean =>
  isValidEnumValue(RAQIV2UIPseudoDimension, dimension);

// Generated `RAQIV2MetricToAlertingEligibleDimensions` now carries per-role lists
// (`{ filter, breakdown }`). The codegen already excludes metric-fanout pseudo dimensions
// (PercentileType / AggregationType) from `breakdown` and excludes Top N pseudo dimensions
// from `filter`, so the only remaining client-side gate is FilterBar feature support on
// the filter side — an unrelated constraint owned by the FilterBar config.
export const getAlertFilterDimensionsForMetric = (
  metric: TAlertConditionMetric,
): TRAQIV2Dimension[] =>
  (RAQIV2MetricToAlertingEligibleDimensions[metric]?.filter ?? []).filter(
    (d) => getFilterBarDimensionForRAQIV2Dimension(d) != null,
  );

export const getAlertBreakdownDimensionsForMetric = (
  metric: TAlertConditionMetric,
): TRAQIV2Dimension[] => RAQIV2MetricToAlertingEligibleDimensions[metric]?.breakdown ?? [];

export function formatApiMetricDisplayName(
  metric: TRAQIV2NumericUIMetric,
  translate: (key: TranslationKey) => string,
): string {
  try {
    const uiMetric = getUIMetric(metric);
    const { localizedName } = getAnalyticsMetricDisplayConfig(uiMetric);
    return localizedName ? translate(localizedName) : metric;
  } catch {
    return metric;
  }
}

const getOperatorDisplaySymbol = (operator: AnalyticsAlertCondition['operator']): string => {
  const op = isValidEnumValue(AnalyticsAlertConditionOperator, operator) ? operator : undefined;
  const symbol = op ? ALERT_CONDITION_OPERATION_SYMBOLS[op] : undefined;
  return symbol ?? operator;
};

const getMetricUnitSuffix = (
  metric: TRAQIV2NumericUIMetric,
  translate: TranslationKeyToFormattedText,
): string => {
  const uiMetric = getUIMetric(metric);
  if (!isNumericUIMetric(uiMetric)) {
    return '';
  }
  const suffix = getConditionValueUnitDisplay(uiMetric, translate);
  return suffix ? ` ${suffix}` : '';
};

const getAlertConditionThresholdUnitSuffix = (
  metric: TRAQIV2NumericUIMetric,
  evaluationMode: AnalyticsAlertEvaluationMode,
  translate: TranslationKeyToFormattedText,
): string => {
  if (evaluationMode === AnalyticsAlertEvaluationMode.PeriodOverPeriod) {
    return ' %';
  }
  return getMetricUnitSuffix(metric, translate);
};

export function formatAlertConditionEquation(
  condition: AnalyticsAlertCondition | undefined,
  metric: TRAQIV2NumericUIMetric,
  translate: TranslationKeyToFormattedText,
): string {
  if (!condition) {
    return '';
  }
  const displaySymbol = getOperatorDisplaySymbol(condition.operator);
  // `condition.threshold` is the raw API value (e.g. `0.05` for a 5%
  // Percentage01 metric or for any PoP threshold, bytes for
  // `ClientMemoryUsage`, etc.). Convert it back to the user-facing display
  // shape so the unit suffix appended below lines up with what the user
  // typed in the form. PoP always renders as `raw * 100` with a `%` suffix.
  const evaluationMode = condition.evaluationMode ?? AnalyticsAlertEvaluationMode.Absolute;
  const thresholdStr =
    formatAlertThresholdRawValueAsDisplay({
      metric,
      evaluationMode,
      rawValue: condition.threshold,
    }) ?? '';
  const unitSuffix = getAlertConditionThresholdUnitSuffix(metric, evaluationMode, translate);
  return `${displaySymbol} ${thresholdStr}${unitSuffix}`.trim();
}

/**
 * Renders one line of the firing-conditions / current-value cell:
 * `"<valueStr><unitSuffix>"`, or `"<valueStr><unitSuffix> (<breakdownLabel>)"`
 * when a single-dimension breakdown is provided. Both `formatIncidentFiringConditions`
 * (firing values from incident metadata) and `formatCurrentValueLines` (live values
 * from RAQI) reuse this so the two columns stay visually consistent.
 */
const formatBreakdownValueLine = (
  valueStr: string,
  unitSuffix: string,
  breakdown: RAQIV2BreakdownValue | undefined,
  translationDependencies: RAQIV2TranslationDependencies,
): string => {
  const formattedValue = `${valueStr}${unitSuffix}`.trim();
  if (!breakdown) {
    return formattedValue;
  }
  const dimensionLabel = getSingleDimensionBreakdownLabel(breakdown, translationDependencies).name;
  return `${formattedValue} (${dimensionLabel})`;
};

/**
 * For percent-style metrics, `formatAnalyticsNumber` (via Intl `style: 'percent'`)
 * already includes the `%` glyph in its output, so the manual unit suffix would
 * double-render it. Other units rely on the shared suffix because the
 * `DataPoint` context's verbosity is `None` and skips `getSuffix`.
 */
const isPercentageUiMetric = (metric: TRAQIV2NumericUIMetric): boolean => {
  const cfg = RAQIV2MetricDisplayConfig[getUIMetric(metric)];
  return cfg.unit === RAQIV2MetricUnit.Percentage01 || cfg.unit === RAQIV2MetricUnit.Percentage0100;
};

/**
 * Shared "format one raw API value the way the spline-chart tooltip would" path
 * used by both the firing-conditions and current-value columns. Returns `null`
 * when the value is non-finite, or when the metric uses a `dataPointTransformerType`
 * with no single-value inverse (e.g. `PercentageOfFirstPoint`), so the caller
 * can drop the line instead of showing a wrong number.
 *
 * The chart adapter applies `dataPointTransformerType` to series data *before*
 * the formatter sees it (see `genericRAQIV2ChartAdapter`). Alert payloads carry
 * raw API values, so we mirror that step here — otherwise metrics like
 * `ComputeEfficiency` (`ScaleBackBy100` + Percentage01) would render `95` as
 * `"9,500%"` and `ClientMemoryUsage` bytes would render in billions of GB.
 */
const formatRawDataPointValueOrNull = (
  rawValue: number,
  metric: TRAQIV2NumericUIMetric,
  translationDependencies: RAQIV2TranslationDependencies,
): string | null => {
  if (!Number.isFinite(rawValue)) {
    return null;
  }
  const transformed = applyDataPointInverseTransform(rawValue, metric);
  if (transformed === null) {
    return null;
  }
  return formatAnalyticsNumber(
    transformed,
    { metric, context: NumberContext.DataPoint },
    translationDependencies,
  );
};

const dataPointUnitSuffix = (
  metric: TRAQIV2NumericUIMetric,
  translate: TranslationKeyToFormattedText,
  evaluationMode: AnalyticsAlertEvaluationMode,
): string => {
  if (evaluationMode === AnalyticsAlertEvaluationMode.PeriodOverPeriod) {
    return '%';
  }
  return isPercentageUiMetric(metric) ? '' : getMetricUnitSuffix(metric, translate);
};

export function formatIncidentFiringConditions(
  firingMetadata: AnalyticsAlertFiringMetadata,
  metric: TRAQIV2NumericUIMetric,
  translationDependencies: RAQIV2TranslationDependencies,
): string[] {
  if (!firingMetadata?.firingCondition.length) {
    return [];
  }
  const { translate } = translationDependencies;
  const unitSuffix = dataPointUnitSuffix(
    metric,
    translate,
    firingMetadata.condition.evaluationMode,
  );
  return firingMetadata.firingCondition.flatMap(({ firingValue, firingDimension }) => {
    // `firingValue` is the raw API value the alert engine evaluated against
    // (e.g. `0.0532` for a 5.32% Percentage01 metric). Run it through the same
    // data-point formatter the spline tooltip uses so the user sees the
    // metric-config-honored display value (decimal precision, percent style,
    // memory-byte → GB transform, locale separators, etc.).
    const valueStr = formatRawDataPointValueOrNull(firingValue, metric, translationDependencies);
    if (valueStr === null) {
      return [];
    }
    return [
      formatBreakdownValueLine(valueStr, unitSuffix, firingDimension, translationDependencies),
    ];
  });
}

const pickLatestDataPointValue = (value: RAQIV2MetricValue): number | null => {
  const { dataPoints } = value;
  if (!dataPoints?.length) {
    return null;
  }
  // Sort defensively: the gateway returns ascending time but we don't want to
  // depend on that ordering for picking the most recent point.
  let latestTime = -Infinity;
  let latestValue: number | null = null;
  dataPoints.forEach((dp) => {
    const time = dp.time ? new Date(dp.time).getTime() : NaN;
    if (!Number.isFinite(time) || time < latestTime) {
      return;
    }
    const numericValue = dp.value ?? NaN;
    if (!Number.isFinite(numericValue)) {
      return;
    }
    latestTime = time;
    latestValue = numericValue;
  });
  return latestValue;
};

/**
 * Live-data sibling of {@link formatIncidentFiringConditions}: turns a RAQI v2
 * response (one `RAQIV2MetricValue` per breakdown combination) into the lines
 * shown in the Active Alerts table's "Current Value" column.
 *
 * The number is formatted with {@link formatAnalyticsNumber} under
 * `NumberContext.DataPoint`, the same path the spline-chart tooltip uses, so
 * decimal precision, percent scaling, and locale come from the metric display
 * config (e.g. raw `0.05` -> `"5%"` for a Percentage01 metric). For
 * non-percent units we still append the short unit suffix that the firing
 * column uses, keeping the two columns visually aligned.
 *
 * Values that have no usable data point are dropped; callers should treat an
 * empty array as a "no data" signal in the cell UI.
 */
export function formatCurrentValueLines(
  values: readonly RAQIV2MetricValue[] | undefined,
  metric: TRAQIV2NumericUIMetric,
  translationDependencies: RAQIV2TranslationDependencies,
  evaluationMode: AnalyticsAlertEvaluationMode,
): string[] {
  if (!values?.length) {
    return [];
  }
  const { translate } = translationDependencies;
  const unitSuffix = dataPointUnitSuffix(metric, translate, evaluationMode);
  return values.flatMap((value) => {
    const rawValue = pickLatestDataPointValue(value);
    if (rawValue === null) {
      return [];
    }
    const displayStr = formatRawDataPointValueOrNull(rawValue, metric, translationDependencies);
    if (displayStr === null) {
      return [];
    }
    // Alerts only support a single breakdown dimension, so the first breakdown
    // entry is the one (if any) we want to surface in parentheses.
    const breakdown = value.breakdownValue?.[0];
    return [formatBreakdownValueLine(displayStr, unitSuffix, breakdown, translationDependencies)];
  });
}
