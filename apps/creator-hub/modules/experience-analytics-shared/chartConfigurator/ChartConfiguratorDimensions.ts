import type { TRAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import {
  RAQIV2Dimension,
  RAQIV2UIPseudoDimension,
  RAQIV2MetricToSupportedDimensions as RAQIV2MetricToSupportedDimensionsFromCodegenConfig,
  RAQIV2DimensionDisplayConfig,
} from '@rbx/creator-hub-analytics-config';
import { ChartType } from '@modules/charts-generic/charts/types/ChartTypes';
import { isValidArrayEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import type { ChartConfiguratorChartType } from './ChartConfiguratorChartTypes';
import type { TChartConfiguratorMetrics } from './chartConfiguratorMetricsConfig';

/**
 * Some dimensions we want to show in the filter bar are not supported as breakdowns,
 * or should not be made available in the UI as breakdown options.
 *
 * Defining those here allows us to build an exhaustive type of all the dimensions
 * in the chart configurator catalog, as well as explicitly exclude them from our breakdown selector.
 *
 * TODO(gperkins@20260120): DSA-2262 move this to the dimension display config
 */
export const ChartConfiguratorFilterOnlyDimensions = [
  RAQIV2Dimension.Country,
  RAQIV2Dimension.Locale,
  RAQIV2Dimension.Place,
  RAQIV2Dimension.MemoryGroup,
  RAQIV2Dimension.ItemSku,
  RAQIV2UIPseudoDimension.AggregationType,
] as const satisfies readonly TRAQIV2Dimension[];

/**
 * Some dimensions are supported as breakdowns in general, but may not be suitable or provide
 * any value for specific chart types. i.e. percentile breakdowns don't make sense for stacked area charts
 * This function allows us to filter out those dimensions
 */
export const getChartConfiguratorFilterOnlyDimensions = (
  chartType: ChartConfiguratorChartType | null,
): readonly TRAQIV2Dimension[] => {
  if (
    chartType === ChartType.Area ||
    // DurationSpline/DurationArea: makeRAQIV2Request's metric fanout path doesn't
    // preserve the duration bucket dimension, so percentile breakdowns return
    // aggregate values instead of per-bucket curves. Exclude until infra is fixed.
    chartType === ChartType.DurationArea ||
    chartType === ChartType.DurationSpline
  ) {
    return [...ChartConfiguratorFilterOnlyDimensions, RAQIV2UIPseudoDimension.PercentileType];
  }
  return ChartConfiguratorFilterOnlyDimensions;
};

const mapRecordValues = <T, U>(obj: Record<string, T>, fn: (value: T) => U): Record<string, U> => {
  return Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, fn(value)]));
};

// Derive the exclusion set from every key of the merged display config (both base
// dimensions and pseudo-dimensions) so that explore-mode-disabled pseudo-dimensions
// (e.g. TopProductKeyForRevenue) are also excluded from breakdown options.
const ChartConfiguratorExcludedDimensionFromCodegenConfig =
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- RAQIV2DimensionDisplayConfig keys are generated from TRAQIV2Dimension (base + pseudo dimensions).
  (Object.keys(RAQIV2DimensionDisplayConfig) as TRAQIV2Dimension[]).filter(
    (dimension) => RAQIV2DimensionDisplayConfig[dimension].isExploreModeDisabled === true,
  );

const RAQIV2MetricToSupportedDimensions: typeof RAQIV2MetricToSupportedDimensionsFromCodegenConfig =
  mapRecordValues(RAQIV2MetricToSupportedDimensionsFromCodegenConfig, (dimensions) =>
    dimensions.filter(
      (dimension) =>
        !isValidArrayEnumValue(ChartConfiguratorExcludedDimensionFromCodegenConfig, dimension),
    ),
  );

/** If there are any metrics' dimensions that need to change based on a feature flag, implement that here */
const getChartConfiguratorDimensions = (): Record<
  TChartConfiguratorMetrics,
  readonly TRAQIV2Dimension[]
> => ({
  ...RAQIV2MetricToSupportedDimensions,
});

const getSharedChartConfiguratorDimensions = (
  metrics: readonly TChartConfiguratorMetrics[],
): readonly TRAQIV2Dimension[] => {
  if (metrics.length === 0) {
    return [];
  }

  const chartConfiguratorDimensions = getChartConfiguratorDimensions();
  const firstMetric = metrics[0];
  if (firstMetric === undefined) {
    return [];
  }
  const otherMetrics = metrics.slice(1);
  const firstMetricDimensions = chartConfiguratorDimensions[firstMetric] || [];
  return firstMetricDimensions.filter((dimension) =>
    otherMetrics.every((sourceMetric) =>
      (chartConfiguratorDimensions[sourceMetric] || []).includes(dimension),
    ),
  );
};

export { getChartConfiguratorDimensions, getSharedChartConfiguratorDimensions };
