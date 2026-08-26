import { useFlag } from '@rbx/flags';
import { isMetricVariantChartStateEnabled as isMetricVariantChartStateEnabledFlag } from '@generated/flags/creatorAnalytics';

/**
 * Rollout gate for DSA-6104 first-class metric-variant chart state.
 * When disabled, Explore Mode keeps PercentileType / AggregationType in
 * `breakdown[]` and does not rewrite `?metricVariant=`. Returns `false`
 * until flags are fetched so URLs are not migrated before the configured
 * value is known.
 */
const useMetricVariantChartStateEnabled = (): boolean => {
  const { ready, value: isMetricVariantChartStateEnabled } = useFlag(
    isMetricVariantChartStateEnabledFlag,
  );

  return ready && isMetricVariantChartStateEnabled;
};

export default useMetricVariantChartStateEnabled;
