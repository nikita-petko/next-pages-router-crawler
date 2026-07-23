import { RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import type { ChartType } from '@modules/charts-generic/charts/types/ChartTypes';
import { isDurationChartType } from '../chartConfigurator/isDurationChartMetric';
import type { TUIGranularity } from '../utils/seriesGranularities';

export type L7SmoothingDisabledReason = 'duration-chart' | 'cumulative-granularity';

export function getL7SmoothingDisabledReason({
  selectedChartType,
  granularity,
}: {
  selectedChartType: ChartType;
  granularity: TUIGranularity;
}): L7SmoothingDisabledReason | null {
  if (isDurationChartType(selectedChartType)) {
    return 'duration-chart';
  }
  if (granularity === RAQIV2MetricGranularity.None) {
    return 'cumulative-granularity';
  }
  return null;
}

export function isL7SmoothingDisabled(args: {
  selectedChartType: ChartType;
  granularity: TUIGranularity;
}): boolean {
  return getL7SmoothingDisabledReason(args) !== null;
}
