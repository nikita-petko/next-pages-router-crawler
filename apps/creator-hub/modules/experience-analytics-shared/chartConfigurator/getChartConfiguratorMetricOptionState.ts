import type { TChartConfiguratorMetrics } from './chartConfiguratorMetricsConfig';
import { isChartConfiguratorPerformanceMetric } from './isChartConfiguratorPerformanceMetric';

export type ChartConfiguratorMetricDisabledReason = 'performanceIneligible';

export type ChartConfiguratorPerformanceAccess = 'unknown' | 'eligible' | 'ineligible';

export type ChartConfiguratorMetricOptionState = {
  readonly disabled: boolean;
  readonly disabledReason: ChartConfiguratorMetricDisabledReason | null;
};

export type ChartConfiguratorMetricEligibility = {
  readonly performanceAccess: ChartConfiguratorPerformanceAccess;
};

const ENABLED_OPTION_STATE: ChartConfiguratorMetricOptionState = {
  disabled: false,
  disabledReason: null,
};

const PERFORMANCE_ACCESS_UNKNOWN_OPTION_STATE: ChartConfiguratorMetricOptionState = {
  disabled: true,
  disabledReason: null,
};

const PERFORMANCE_INELIGIBLE_OPTION_STATE: ChartConfiguratorMetricOptionState = {
  disabled: true,
  disabledReason: 'performanceIneligible',
};

export const getChartConfiguratorMetricOptionState = (
  metric: TChartConfiguratorMetrics,
  eligibility: ChartConfiguratorMetricEligibility,
): ChartConfiguratorMetricOptionState => {
  if (!isChartConfiguratorPerformanceMetric(metric)) {
    return ENABLED_OPTION_STATE;
  }
  if (eligibility.performanceAccess === 'eligible') {
    return ENABLED_OPTION_STATE;
  }
  if (eligibility.performanceAccess === 'unknown') {
    return PERFORMANCE_ACCESS_UNKNOWN_OPTION_STATE;
  }
  return PERFORMANCE_INELIGIBLE_OPTION_STATE;
};

export const getChartConfiguratorMetricOptionStates = (
  metrics: readonly TChartConfiguratorMetrics[],
  eligibility: ChartConfiguratorMetricEligibility,
): ReadonlyMap<TChartConfiguratorMetrics, ChartConfiguratorMetricOptionState> => {
  const states = new Map<TChartConfiguratorMetrics, ChartConfiguratorMetricOptionState>();
  metrics.forEach((metric) => {
    states.set(metric, getChartConfiguratorMetricOptionState(metric, eligibility));
  });
  return states;
};
