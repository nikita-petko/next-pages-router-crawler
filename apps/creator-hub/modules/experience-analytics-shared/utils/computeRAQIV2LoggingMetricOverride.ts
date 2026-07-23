import type { TRAQIV2UIMetric } from '@rbx/creator-hub-analytics-config';

const computeRAQIV2LoggingMetricOverride = (metric: TRAQIV2UIMetric, override?: string): string => {
  return override || metric;
};
export default computeRAQIV2LoggingMetricOverride;
