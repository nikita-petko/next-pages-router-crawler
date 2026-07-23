import { useFlag } from '@rbx/flags';
import { isAnalyticsMetricAwareYAxisFormatterEnabled as isAnalyticsMetricAwareYAxisFormatterEnabledFlag } from '@generated/flags/creatorAnalytics';

/**
 * Kill-switch for the DSA-5725 metric-aware Y-axis formatter on RAQI v2
 * charts. When disabled (default until rollout), non-percent axes fall
 * back to Highcharts' built-in label formatter — preserving the
 * pre-DSA-5725 behavior. When enabled, axes route through the metric's
 * `formattingSpec` with `notation: 'compact'` for abbreviation and the
 * small-value scientific-notation fallback for tiny values.
 *
 * Returns `false` until flags are fetched so the chart never flashes the
 * new format before settling on the configured value.
 */
const useMetricAwareYAxisFormatterEnabled = (): boolean => {
  const { ready, value: isAnalyticsMetricAwareYAxisFormatterEnabled } = useFlag(
    isAnalyticsMetricAwareYAxisFormatterEnabledFlag,
  );

  return ready && isAnalyticsMetricAwareYAxisFormatterEnabled;
};

export default useMetricAwareYAxisFormatterEnabled;
