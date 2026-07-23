import { RAQIV2Metric } from '@rbx/creator-hub-analytics-config';
import {
  getAllChartConfiguratorMetrics,
  getChartConfiguratorExcludedMetrics,
  isChartConfiguratorMetric,
  type TChartConfiguratorMetrics,
} from './chartConfiguratorMetricsConfig';
import { precomputedL7Metrics } from './l7MetricMapping';

const getEnabledChartConfiguratorMetrics = ({
  isClientScriptCPUTimeEnabled,
  isRotraceMetricEnabled,
  isHomeAcquisitionSignalsEnabled,
}: {
  isClientScriptCPUTimeEnabled: boolean;
  isRotraceMetricEnabled: boolean;
  isHomeAcquisitionSignalsEnabled: boolean;
}): readonly TChartConfiguratorMetrics[] => {
  const disabledMetrics = [
    ...getChartConfiguratorExcludedMetrics(),
    ...(!isClientScriptCPUTimeEnabled ? [RAQIV2Metric.ClientCpuTimeAvg] : []),
    ...(!isRotraceMetricEnabled ? [RAQIV2Metric.RotraceTotalCalls] : []),
    ...(isHomeAcquisitionSignalsEnabled
      ? [RAQIV2Metric.QualifiedEndToEndCVR, RAQIV2Metric.RFYQualifiedPTR]
      : [RAQIV2Metric.L7AverageRFYPlayThroughRate, RAQIV2Metric.EndToEndCVR]),
  ].filter(isChartConfiguratorMetric);

  return getAllChartConfiguratorMetrics().filter(
    (metricOption) =>
      !disabledMetrics.includes(metricOption) && !precomputedL7Metrics.has(metricOption),
  );
};

export default getEnabledChartConfiguratorMetrics;
