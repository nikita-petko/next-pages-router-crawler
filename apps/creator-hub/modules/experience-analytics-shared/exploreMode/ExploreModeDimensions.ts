import {
  RAQIV2Dimension,
  RAQIV2UIPseudoDimension,
  TRAQIV2Dimension,
  RAQIV2MetricToSupportedDimensions as RAQIV2MetricToSupportedDimensionsFromCodegenConfig,
  RAQIV2DimensionDisplayConfig,
} from '@rbx/creator-hub-analytics-config';
import { TRAQIV2BreakdownDimension } from '@modules/clients/analytics';
import { ChartType } from '@modules/charts-generic';
import { isValidArrayEnumValue } from '@modules/miscellaneous/common/utils/enumUtils';
import type { ExploreModeChartType } from './ExploreModeChartTypes';
import { TExploreModeMetrics } from './exploreModeMetricsConfig';

/**
 * Some dimensions we want to show in the filter bar are not supported as breakdowns,
 * or should not be made available in the UI as breakdown options.
 *
 * Defining those here allows us to build an exhaustive type of all the dimensions
 * in the explore mode, as well as explicitly exclude them from our breakdown selector.
 *
 * TODO(gperkins@20260120): DSA-2262 move this to the dimension display config
 */
export const ExploreModeFilterOnlyDimensions = [
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
export const getExploreModeFilterOnlyDimensions = (
  chartType: ExploreModeChartType | null,
): readonly TRAQIV2Dimension[] => {
  if (chartType === ChartType.Area || chartType === ChartType.DurationArea) {
    return [...ExploreModeFilterOnlyDimensions, RAQIV2UIPseudoDimension.PercentileType];
  }
  return ExploreModeFilterOnlyDimensions;
};

const mapRecordValues = <T, U>(obj: Record<string, T>, fn: (value: T) => U): Record<string, U> => {
  return Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, fn(value)]));
};

const ExploreModeExcludedDimensionFromCodegenConfig = (
  Object.entries(RAQIV2DimensionDisplayConfig) as Array<
    [
      TRAQIV2Dimension,
      (typeof RAQIV2DimensionDisplayConfig)[keyof typeof RAQIV2DimensionDisplayConfig],
    ]
  >
)
  .filter(([, config]) => config.isExploreModeDisabled === true)
  .map(([dimension]) => dimension);

const RAQIV2MetricToSupportedDimensions: typeof RAQIV2MetricToSupportedDimensionsFromCodegenConfig =
  mapRecordValues(RAQIV2MetricToSupportedDimensionsFromCodegenConfig, (dimensions) =>
    dimensions.filter(
      (dimension) =>
        !isValidArrayEnumValue(ExploreModeExcludedDimensionFromCodegenConfig, dimension),
    ),
  );

/** If there are any metrics' dimensions that need to change based on a feature flag, implement that here */
const getExploreModeDimensions = (): Record<
  TExploreModeMetrics,
  readonly TRAQIV2BreakdownDimension[]
> => ({ ...RAQIV2MetricToSupportedDimensions });

export { getExploreModeDimensions };
