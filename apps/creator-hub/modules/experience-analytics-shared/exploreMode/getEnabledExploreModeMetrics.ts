import { RAQIV2Metric } from '@rbx/creator-hub-analytics-config';
import {
  getAllExploreModeMetrics,
  getExploreModeExcludedMetrics,
  type TExploreModeMetrics,
} from './exploreModeMetricsConfig';
import { precomputedL7Metrics } from './l7MetricMapping';

const getEnabledExploreModeMetrics = ({
  isClientScriptCPUTimeEnabled,
  isRotraceMetricEnabled,
  isDeepPlayEnabled,
  isNewRFYSignalsEnabled,
  isExploreModeL7SmoothingEnabled = false,
}: {
  isClientScriptCPUTimeEnabled: boolean;
  isRotraceMetricEnabled: boolean;
  isDeepPlayEnabled: boolean;
  isNewRFYSignalsEnabled: boolean;
  isExploreModeL7SmoothingEnabled?: boolean;
}): readonly TExploreModeMetrics[] => {
  const disabledMetrics = [
    ...getExploreModeExcludedMetrics(),
    ...(isClientScriptCPUTimeEnabled
      ? ([] as TExploreModeMetrics[])
      : [RAQIV2Metric.ClientCpuTimeAvg as TExploreModeMetrics]),
    ...(isRotraceMetricEnabled
      ? ([] as TExploreModeMetrics[])
      : [RAQIV2Metric.RotraceTotalCalls as TExploreModeMetrics]),
    ...(isDeepPlayEnabled
      ? ([] as TExploreModeMetrics[])
      : [RAQIV2Metric.RFYDeepEngagementRate as TExploreModeMetrics]),
    ...(isNewRFYSignalsEnabled
      ? ([] as TExploreModeMetrics[])
      : [
          RAQIV2Metric.RFYL7PlaySessionsPerUser,
          RAQIV2Metric.RFYUniqueNotInterestedUsersPerMillionImpressions,
        ]),
  ] as TExploreModeMetrics[];
  return getAllExploreModeMetrics().filter(
    (metricOption) =>
      !disabledMetrics.includes(metricOption) &&
      (!isExploreModeL7SmoothingEnabled || !precomputedL7Metrics.has(metricOption)),
  );
};

export default getEnabledExploreModeMetrics;
