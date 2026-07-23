import type { TFormattingSpec } from './types/FormattingSpec';

/**
 * Number of significant digits used for Y-axis tick labels. With
 * `notation: 'compact'`, this is what determines how much precision the
 * abbreviation preserves: e.g. `1250` renders as `1.25K` with 3 sig figs,
 * but as `1K` if we accidentally fall back to the metric's
 * `maximumFractionDigits: 0` (the case for most integer-valued metrics).
 * Three sig figs matches Highcharts' built-in axis label precision.
 */
const Y_AXIS_MAX_SIGNIFICANT_DIGITS = 3;

/**
 * Derives an axis-tuned formatting spec from a metric's data-point spec.
 *
 * Y-axis ticks need different precision rules than data points / tooltips:
 * the metric's `formattingSpec` typically has `maximumFractionDigits: 0`
 * for integer-valued metrics like DAU (correct for tooltips: render
 * `1,250` exactly), but on an axis we want the abbreviated form to
 * preserve precision (`1.25K`, not `1K`). We swap fraction-digit-based
 * rounding for `maximumSignificantDigits: 3`, which Intl's
 * `roundingPriority: 'auto'` honors over the inherited fraction-digit
 * constraint, and keep `notation: 'compact'` so K/M/B/T abbreviations
 * still apply. Everything else from the metric spec (style: 'percent' /
 * 'currency', prefix/suffix/icon, scaling factor, etc.) is preserved.
 *
 * Long-term, axis formatting could become a first-class `NumberContext`
 * with per-metric verbosity entries — see the formatting-consistency
 * follow-up ticket. This helper is the localized fix for DSA-5725.
 */
const buildAxisFormattingSpec = (formattingSpec: TFormattingSpec): TFormattingSpec => ({
  ...formattingSpec,
  numberFormatOptions: {
    ...formattingSpec.numberFormatOptions,
    notation: 'compact',
    maximumSignificantDigits: Y_AXIS_MAX_SIGNIFICANT_DIGITS,
  },
});

export default buildAxisFormattingSpec;
