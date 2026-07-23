import { ChartType } from '@modules/charts-generic/charts/types/ChartTypes';
import type { ChartConfiguratorChartType } from '@modules/experience-analytics-shared/chartConfigurator/ChartConfiguratorChartTypes';
import type { ChartTileConfig, CustomDashboardChartType } from '../types';

export type ChartTileRenderChartConfig =
  | {
      readonly chartType: ChartType.Spline | ChartType.Area | ChartType.Bar | ChartType.Pie;
      readonly stacking?: undefined;
    }
  | { readonly chartType: ChartType.Column; readonly stacking?: undefined };

/** Maps a persisted tile to renderer `ChartType` + display options. */
export function chartTileToRenderConfig(
  tile: Pick<ChartTileConfig, 'chartSpec'>,
): ChartTileRenderChartConfig | null {
  switch (tile.chartSpec.chartType) {
    case ChartType.Spline:
    case ChartType.Area:
    case ChartType.Bar:
    case ChartType.Pie:
      return { chartType: tile.chartSpec.chartType };
    case ChartType.Column:
      return { chartType: ChartType.Column };
    case ChartType.Table:
    default:
      return null;
  }
}

/** Maps a render-time chart config into persisted tile fields. */
export function renderChartTypeToTileFields(
  chartType: ChartType,
): Pick<ChartTileConfig['chartSpec'], 'chartType'> | null {
  switch (chartType) {
    case ChartType.Spline:
      return { chartType: ChartType.Spline };
    case ChartType.Area:
      return { chartType: ChartType.Area };
    case ChartType.Bar:
      return { chartType: ChartType.Bar };
    case ChartType.Column:
      return { chartType: ChartType.Column };
    case ChartType.Pie:
      return { chartType: ChartType.Pie };
    case ChartType.DurationArea:
    case ChartType.DurationSpline:
    case ChartType.Map:
    case ChartType.MultipleMetricSpline:
    case ChartType.Table:
      return null;
  }
  return null;
}

const EXPLORE_TO_TILE_CHART_TYPE: Partial<
  Record<ChartConfiguratorChartType, CustomDashboardChartType>
> = {
  [ChartType.Spline]: ChartType.Spline,
  [ChartType.Area]: ChartType.Area,
  [ChartType.Bar]: ChartType.Bar,
  [ChartType.Column]: ChartType.Column,
  [ChartType.Pie]: ChartType.Pie,
  [ChartType.Table]: ChartType.Table,
};

/** Explore Mode chart families that can be saved on a custom-dashboard tile. */
export function exploreChartTypeToTileChartType(
  chartType: ChartConfiguratorChartType,
): CustomDashboardChartType | null {
  return EXPLORE_TO_TILE_CHART_TYPE[chartType] ?? null;
}

/** Hydrates the chart editor from a persisted tile. */
export function tileChartTypeToExploreChartType(
  chartType: CustomDashboardChartType,
): ChartConfiguratorChartType {
  return chartType;
}
