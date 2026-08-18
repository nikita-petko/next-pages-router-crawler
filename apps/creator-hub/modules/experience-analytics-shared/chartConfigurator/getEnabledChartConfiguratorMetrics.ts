import { RAQIV2Metric, RAQIV2UIMetric } from '@rbx/creator-hub-analytics-config';
import {
  getAllChartConfiguratorMetrics,
  getChartConfiguratorExcludedMetrics,
  isChartConfiguratorMetric,
  type TChartConfiguratorMetrics,
} from './chartConfiguratorMetricsConfig';
import { precomputedL7Metrics } from './l7MetricMapping';

const getEnabledChartConfiguratorMetrics = ({
  isRotraceMetricEnabled,
  isHomeAcquisitionSignalsEnabled,
  isTelemetryMigrationEnabled,
}: {
  isRotraceMetricEnabled: boolean;
  isHomeAcquisitionSignalsEnabled: boolean;
  isTelemetryMigrationEnabled: boolean;
}): readonly TChartConfiguratorMetrics[] => {
  const disabledMetrics = [
    ...getChartConfiguratorExcludedMetrics(),
    ...(!isRotraceMetricEnabled ? [RAQIV2Metric.RotraceTotalCalls] : []),
    ...(!isTelemetryMigrationEnabled
      ? [
          RAQIV2Metric.ClientCrashCountMigration,
          RAQIV2Metric.ClientCrashRate15mMigration,
          RAQIV2Metric.OomUnexpectedExitsMigration,
          RAQIV2UIMetric.SessionDurationSecondsMigration,
        ]
      : []),
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
