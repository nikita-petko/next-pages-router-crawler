import { ChartType } from '@modules/charts-generic';

/**
 * Extends ChartType with explore-mode-only options (e.g. Table) that don't
 * exist in the generic charting layer.
 */
export type ExploreModeChartType = ChartType | 'Table';
export const EXPLORE_MODE_TABLE: ExploreModeChartType = 'Table' as const;

const exploreModeSupportedChartTypes = [
  ChartType.Spline,
  ChartType.Area,
  ChartType.Column,
  ChartType.DurationSpline,
  ChartType.DurationArea,
  ChartType.Bar,
  ChartType.Pie,
] as const;

type ExploreModeSupportedChartType = (typeof exploreModeSupportedChartTypes)[number];

export const isExploreModeSupportedChartType = (
  chartType: ExploreModeChartType,
): chartType is ExploreModeSupportedChartType => {
  return exploreModeSupportedChartTypes.includes(chartType as ExploreModeSupportedChartType);
};

export default exploreModeSupportedChartTypes;
