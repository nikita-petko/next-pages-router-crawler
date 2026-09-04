import type { ChartType } from '@modules/charts-generic/charts/types/ChartTypes';
import getGranularityOptionsForMetric from '@modules/experience-analytics-shared/chartConfigurator/getGranularityOptionsForMetric';
import type { TRAQIV2NumericUIMetric } from '@modules/experience-analytics-shared/constants/AnalyticsMetricDisplayConfig';
import type RAQIV2ChartContext from '@modules/experience-analytics-shared/types/RAQIV2ChartContext';
import computeRAQIV2SpecOverride, {
  type SpecOverride,
} from '@modules/experience-analytics-shared/utils/computeRAQIV2SpecOverride';
import { getClosestAllowedGranularity } from '@modules/experience-analytics-shared/utils/seriesGranularities';
import { isDurationChartType } from './chartTypeMapping';

type ChartConfigWithGranularityOverride = {
  readonly metric: TRAQIV2NumericUIMetric;
  readonly chartType?: ChartType;
  readonly overrides: SpecOverride;
};

/**
 * Resolves a tile's requested granularity against the spec after tile
 * overrides are applied, including the tile's own breakdown.
 */
export function coerceChartConfigGranularity<T extends ChartConfigWithGranularityOverride>(
  component: T,
  chartContext: RAQIV2ChartContext,
): T {
  if (isDurationChartType(component.chartType)) {
    return component;
  }
  const requestedGranularity = component.overrides.granularity?.override;
  if (!requestedGranularity) {
    return component;
  }
  const chartSpec = computeRAQIV2SpecOverride(
    { ...chartContext, metric: component.metric },
    component.overrides,
  );
  const supportedGranularities = getGranularityOptionsForMetric({
    metric: chartSpec.metric,
    startDate: chartContext.timeSpec.startTime,
    endDate: chartContext.timeSpec.endTime,
    breakdown: chartSpec.breakdown,
  })
    .filter((option) => option.isAllowed)
    .map((option) => option.granularity);
  const granularity = getClosestAllowedGranularity({
    startDate: chartContext.timeSpec.startTime,
    endDate: chartContext.timeSpec.endTime,
    granularity: requestedGranularity,
    supportedGranularities,
  });
  if (granularity === requestedGranularity) {
    return component;
  }
  return {
    ...component,
    overrides: {
      ...component.overrides,
      granularity: { override: granularity },
    },
  };
}
