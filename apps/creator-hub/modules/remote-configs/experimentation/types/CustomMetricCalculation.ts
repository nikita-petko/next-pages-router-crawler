/**
 * The computation a custom metric performs on its selected event source.
 *
 * TEMPORARY enum: the custom-metrics calculations will fold into `RAQIV2Metric`
 * once the two unify, but they are kept as a separate local enum for now. Only
 * the Phase 1 / Alpha **P0** calculations are modelled here — the P1
 * calculations (custom counts, currency penetration / transaction counts,
 * ending wallet balance, etc.) are intentionally omitted until they're built.
 *
 * Each value belongs to exactly one category (see `CALCULATIONS_BY_CATEGORY` in
 * `customMetricOptions`). Formulae, for reference:
 * - Economy net/source/sink deltas are summed economy amounts (by flow type)
 *   over enrolled users.
 * - Custom value calculations are summed custom-event values over the enrolled
 *   users who logged the event (or all enrolled users), and penetration is the
 *   share of enrolled users who logged the event at least once.
 * - Funnel conversions are the per-user and per-instance completion rates of the
 *   selected funnel up to the chosen step (there is no separate cumulative
 *   conversion — it's the two: user % and session %).
 */
export enum CustomMetricCalculation {
  // --- Custom event ---
  // sum of custom event values ÷ enrolled users who logged 1+ of the event
  AverageCustomValue = 'AverageCustomValue',
  // sum of custom event values ÷ all enrolled users
  AverageCustomValueAllUsers = 'AverageCustomValueAllUsers',
  // enrolled users who logged 1+ of the event ÷ all enrolled users
  CustomPenetration = 'CustomPenetration',

  // --- Economy ---
  // (sum of 'Source' amounts − sum of 'Sink' amounts) ÷ all enrolled users
  AverageNetCurrencyDelta = 'AverageNetCurrencyDelta',
  // sum of 'Source' amounts ÷ all enrolled users
  AverageCurrencySourceDelta = 'AverageCurrencySourceDelta',
  // sum of 'Sink' amounts ÷ all enrolled users
  AverageCurrencySinkDelta = 'AverageCurrencySinkDelta',

  // --- Funnel ---
  // user %: unique users reaching the chosen step ÷ unique users who logged any step
  PerUserFunnelConversion = 'PerUserFunnelConversion',
  // unique funnel sessions reaching the threshold step ÷ sessions logging any step
  PerInstanceFunnelConversion = 'PerInstanceFunnelConversion',
}

// Plain-English label per calculation, used to build the auto-generated metric
// NAME (a stored value, not localized per viewer). The drawer's Calculation
// dropdown uses its own per-calculation `tPendingTranslation` labels so each
// option can be localized independently.
export const CUSTOM_METRIC_CALCULATION_LABELS: Record<CustomMetricCalculation, string> = {
  [CustomMetricCalculation.AverageCustomValue]: 'Average Custom Value',
  [CustomMetricCalculation.AverageCustomValueAllUsers]: 'Average Custom Value over all Users',
  [CustomMetricCalculation.CustomPenetration]: 'Custom Penetration %',
  [CustomMetricCalculation.AverageNetCurrencyDelta]: 'Average Net Currency Delta',
  [CustomMetricCalculation.AverageCurrencySourceDelta]: 'Average Currency Source Delta',
  [CustomMetricCalculation.AverageCurrencySinkDelta]: 'Average Currency Sink Delta',
  [CustomMetricCalculation.PerUserFunnelConversion]: 'Per-User Funnel Conversion %',
  [CustomMetricCalculation.PerInstanceFunnelConversion]: 'Per-Instance Funnel Conversion %',
};
