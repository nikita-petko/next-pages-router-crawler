import type {
  CustomDashboardChartRow,
  CustomDashboardConfig,
  DashboardSurfaceControls,
  SummaryCardTileConfig,
  TileId,
} from '../types';
import { selectChartPlacements, type ChartPlacement } from './chartPlacements';
import { getChartRows, getDashboardSurface, getSummaryCards } from './dashboardLayout';

export type SummaryCardPlacement = {
  readonly tileId: TileId;
  readonly tile: SummaryCardTileConfig;
  readonly order: number;
};

export type DashboardRenderModel = {
  readonly summaryPlacements: ReadonlyArray<SummaryCardPlacement>;
  readonly chartPlacements: ReadonlyArray<ChartPlacement>;
  readonly chartRows: ReadonlyArray<CustomDashboardChartRow>;
  readonly dashboardControls: DashboardSurfaceControls;
};

export function selectDashboardCanvasModel(config: CustomDashboardConfig): DashboardRenderModel {
  const surface = getDashboardSurface(config);
  const summaryCards = getSummaryCards(config);
  const chartRows = getChartRows(config);
  const summaryPlacements = summaryCards.map((tile, order) => ({
    tileId: tile.tileId,
    tile,
    order,
  }));

  return {
    summaryPlacements,
    chartPlacements: selectChartPlacements(chartRows),
    chartRows,
    dashboardControls: surface.controls,
  };
}
