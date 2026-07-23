import { RAQIV2MetricValueType } from '@rbx/creator-hub-analytics-config';
import { NumberContext } from '@modules/charts-generic/charts/numberFormatters';
import getMetricDisplayConfig from '@modules/experience-analytics-shared/constants/AnalyticsMetricDisplayConfig';
import { NumericDataPointTransformerType } from '@modules/experience-analytics-shared/constants/NumericDataPointTransformerConfig';
import {
  isComputedMetric,
  getUIMetricFromAtomicMetricLike,
} from '@modules/experience-analytics-shared/types/ComputedMetric';
import {
  generateAnalyticsNumberFormattingSpec,
  type TAnalyticsNumberFormatterArgs,
  type TNumberContextMetadata,
} from '@modules/experience-analytics-shared/utils/analyticsNumberFormattingSpec';

export type TParseAnalyticsMetricDisplayValueArgs = {
  /** Same metric type the data-point formatter accepts (UI metric or computed). */
  metric: TAnalyticsNumberFormatterArgs['metric'];
  /** Raw user input from a text field. */
  displayValue: string;
  /**
   * Same context object the data-point formatter takes. Lets the parser align
   * with the exact spec the chart used (e.g. when chart-spec-derived overrides
   * influence the spec). For most alert-form metrics this can be omitted.
   */
  numberContextMetadata?: TNumberContextMetadata;
};

/**
 * Inverse scale factors for the value-changing data point transformers
 * applied by `genericRAQIV2ChartAdapter` *before* the formatter sees a value.
 * The forward transformer multiplies by `1/N` (e.g. bytes -> GB divides by
 * 1e9), so the inverse multiplies by `N`.
 *
 * `PercentageOfFirstPoint` is intentionally omitted: its forward transform
 * is `value / firstPoint * 100`, which depends on the original series and
 * has no single-value inverse. Metrics using it are not eligible for
 * threshold-style alerting today; a missing entry triggers a `null` return
 * so callers surface the input as invalid rather than silently round-trip
 * a wrong threshold.
 */
const DataPointTransformerInverseScaleFactor: Partial<
  Record<NumericDataPointTransformerType, number>
> = {
  [NumericDataPointTransformerType.ScaleBackBy100]: 100,
  [NumericDataPointTransformerType.ScaleBackBy60]: 60,
  [NumericDataPointTransformerType.ScaleBackBy3600]: 3600,
  [NumericDataPointTransformerType.ScaleBackBy1000000000]: 1_000_000_000,
};

/**
 * Applies the inverse of the chart adapter's `dataPointTransformerType` to a
 * raw API value, producing the value that {@link formatAnalyticsNumber}
 * (running under `NumberContext.DataPoint`) expects to receive — i.e. the
 * post-adapter value the spline-chart formatter would normally see.
 *
 * Returns the value unchanged for metrics that have no transformer (or for
 * computed metrics, which aren't backed by a single display config). Returns
 * `null` for metrics whose transformer has no single-value inverse (e.g.
 * `PercentageOfFirstPoint`), so callers can drop the value rather than show
 * a wrong number.
 */
export const applyDataPointInverseTransform = (
  rawValue: number,
  metric: TAnalyticsNumberFormatterArgs['metric'],
): number | null => {
  if (isComputedMetric(metric)) {
    return rawValue;
  }
  const cfg = getMetricDisplayConfig(getUIMetricFromAtomicMetricLike(metric));
  if (cfg.valueType !== RAQIV2MetricValueType.Numeric || !cfg.dataPointTransformerType) {
    return rawValue;
  }
  const inverseScale = DataPointTransformerInverseScaleFactor[cfg.dataPointTransformerType];
  if (inverseScale === undefined) {
    return null;
  }
  return rawValue / inverseScale;
};

/**
 * `Intl.NumberFormat` with `style: 'percent'` renders a fractional value as
 * a percentage by visually multiplying the input by 100 (e.g. `0.05` -> `"5%"`).
 * The forward formatter relies on that built-in multiplier, so when we replay
 * or invert the rendering numerically we apply the same factor by hand.
 */
const INTL_PERCENT_STYLE_MULTIPLIER = 100;

/**
 * Cleans up the float artifacts produced by replaying the forward chain
 * (e.g. `0.05 * 100 === 5.000000000000001`). Trimming to 15 significant
 * digits is well within IEEE 754 double precision (~15.95 digits) and is
 * enough to recover the value the user originally typed for any threshold
 * we reasonably expect to see.
 */
const cleanFloatArtifact = (value: number): number => Number(value.toPrecision(15));

/**
 * Strips a single trailing `%`, currency-style leading symbols (`$`, `¥`),
 * common Robux glyphs, and surrounding whitespace before parsing. Kept
 * deliberately conservative so we don't paper over genuinely bad input
 * (e.g. letters in the middle of the number). Anything not consumed here
 * is left for `Number.parseFloat` to reject.
 */
const stripFormattingAffixes = (value: string): string => {
  let trimmed = value.trim();
  if (trimmed.endsWith('%')) {
    trimmed = trimmed.slice(0, -1).trimEnd();
  }
  // Leading currency / Robux glyphs the chart formatter can prepend via
  // the spec's `prefix` (e.g. `¥` in Luobu, `$` for USD-styled metrics).
  // The Robux icon is rendered as a React node by the chart, never as a
  // typed character, so we don't try to handle it here.
  while (trimmed.length > 0 && /[$¥R]/.test(trimmed[0])) {
    trimmed = trimmed.slice(1).trimStart();
  }
  return trimmed;
};

/**
 * Inverse of the data-point rendering pipeline RAQI spline charts apply to
 * each backend point. Given a string the user typed in the same shape they
 * would see in a spline-chart tooltip (e.g. `5%` for a Percentage01 metric,
 * `2.5` for `ClientMemoryUsage` rendered in GB), returns the raw value the
 * API expects.
 *
 * Forward chain (`R` = raw backend value, `D` = displayed number):
 *
 *   R --[adapter dataPointTransformerType: x 1/N]--> T
 *     --[formatter scalingFactor: x SF]--> S
 *     --[Intl style: 'percent' renders S as S*100]--> D
 *
 * This function reverses each value-changing step in the opposite order:
 *
 *   1. `numberFormatOptions.style === 'percent'` — divide D by 100.
 *   2. `scalingFactor` (e.g. Percentage0100 sets `0.01`) — divide by it.
 *   3. `dataPointTransformerType` (e.g. `ScaleBackBy1000000000` for
 *      `ClientMemoryUsage` converts bytes to GB) — multiply by the inverse
 *      from `DataPointTransformerInverseScaleFactor`.
 *
 * Decimal precision, suffix/prefix, abbreviation, scientific-notation
 * fallbacks, and currency / locale styling are presentational in the
 * forward path and have no inverse here.
 *
 * Returns `null` for blank input, anything `Number.parseFloat` can't handle
 * as a finite number, or metrics whose data-point transformer is not
 * single-value invertible (e.g. `PercentageOfFirstPoint`); callers decide
 * how to surface the error.
 */
export const parseAnalyticsMetricDisplayValueToRaw = ({
  metric,
  displayValue,
  numberContextMetadata,
}: TParseAnalyticsMetricDisplayValueArgs): number | null => {
  const sanitized = stripFormattingAffixes(displayValue);
  if (sanitized === '') {
    return null;
  }

  const parsed = Number.parseFloat(sanitized);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  const spec = generateAnalyticsNumberFormattingSpec({
    metric,
    context: NumberContext.DataPoint,
    numberContextMetadata,
  });

  let value = parsed;
  if (spec.numberFormatOptions.style === 'percent') {
    value /= INTL_PERCENT_STYLE_MULTIPLIER;
  }
  if (spec.scalingFactor) {
    value /= spec.scalingFactor;
  }

  // Computed metrics aren't backed by a single display config (their value
  // is derived client-side from a formula), so there is no transformer to
  // reverse. The chart adapter only applies `dataPointTransformerType` to
  // atomic numeric metrics, so this matches the forward path exactly.
  if (!isComputedMetric(metric)) {
    const cfg = getMetricDisplayConfig(getUIMetricFromAtomicMetricLike(metric));
    // `dataPointTransformerType` lives on the numeric branch of the merged
    // display-config union; narrow before reading.
    if (cfg.valueType === RAQIV2MetricValueType.Numeric && cfg.dataPointTransformerType) {
      const inverseScale = DataPointTransformerInverseScaleFactor[cfg.dataPointTransformerType];
      if (inverseScale === undefined) {
        return null;
      }
      value *= inverseScale;
    }
  }

  return value;
};

export type TFormatAnalyticsMetricRawValueAsDisplayArgs = {
  /** Same metric type the data-point formatter accepts (UI metric or computed). */
  metric: TAnalyticsNumberFormatterArgs['metric'];
  /** Raw API value (the shape stored on the backend, e.g. `0.05` for a 5% Percentage01 metric). */
  rawValue: number;
  /**
   * Same context object the data-point formatter takes. Lets the formatter
   * align with the exact spec the chart used. Optional for most alert-form
   * metrics.
   */
  numberContextMetadata?: TNumberContextMetadata;
};

/**
 * Forward of the value-changing portion of the data-point rendering pipeline,
 * and exact inverse of {@link parseAnalyticsMetricDisplayValueToRaw}. Given a
 * raw API value, returns the bare numeric string the user would have typed
 * in the alert form (e.g. `0.05` -> `"5"` for Percentage01, `2_500_000_000`
 * -> `"2.5"` for `ClientMemoryUsage` displayed in GB).
 *
 * Steps mirror the forward chain `R -> T -> S -> D` (see
 * {@link parseAnalyticsMetricDisplayValueToRaw} for the diagram):
 *
 *   1. `dataPointTransformerType` — divide by the matching inverse-scale
 *      entry (the chart adapter applies `x 1/N`).
 *   2. `scalingFactor` — multiply.
 *   3. `numberFormatOptions.style === 'percent'` — multiply by 100 to match
 *      the visual multiplier `Intl.NumberFormat` applies in percent style.
 *
 * Float artifacts produced by the multiplications are smoothed with
 * {@link cleanFloatArtifact} so the result round-trips cleanly through
 * `parseAnalyticsMetricDisplayValueToRaw`.
 *
 * Decimal precision, suffix/prefix, abbreviation, scientific-notation
 * fallbacks, and currency / locale styling are *not* applied: the alert
 * form's threshold input is a plain text field, and unit suffixes are added
 * separately by the surrounding UI.
 *
 * Returns `null` for non-finite input or metrics whose data-point transformer
 * is not single-value invertible (e.g. `PercentageOfFirstPoint`), matching
 * the parser's failure modes so callers can apply a single fallback.
 */
export const formatAnalyticsMetricRawValueAsDisplay = ({
  metric,
  rawValue,
  numberContextMetadata,
}: TFormatAnalyticsMetricRawValueAsDisplayArgs): string | null => {
  if (!Number.isFinite(rawValue)) {
    return null;
  }

  const transformed = applyDataPointInverseTransform(rawValue, metric);
  if (transformed === null) {
    return null;
  }
  let value = transformed;

  const spec = generateAnalyticsNumberFormattingSpec({
    metric,
    context: NumberContext.DataPoint,
    numberContextMetadata,
  });

  if (spec.scalingFactor) {
    value *= spec.scalingFactor;
  }
  if (spec.numberFormatOptions.style === 'percent') {
    value *= INTL_PERCENT_STYLE_MULTIPLIER;
  }

  return String(cleanFloatArtifact(value));
};
