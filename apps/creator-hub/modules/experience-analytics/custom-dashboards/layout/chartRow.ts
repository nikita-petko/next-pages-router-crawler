import type {
  ChartTileConfig,
  CustomDashboardChartRow,
  CustomDashboardChartRowColumnCount,
} from '../types';

export function getChartRowTiles(row: CustomDashboardChartRow): ReadonlyArray<ChartTileConfig> {
  return row.tiles;
}

export function getChartRowColumnCount(
  row: CustomDashboardChartRow,
): CustomDashboardChartRowColumnCount {
  return row.columnCount;
}

/** Full-width single-tile row (tests and adapters). */
export function singleTileRow(tile: ChartTileConfig): CustomDashboardChartRow {
  return { tiles: [tile], columnCount: 1 };
}

/** Half-width slot: one tile in a two-column row. */
export function halfWidthRow(tile: ChartTileConfig): CustomDashboardChartRow {
  return { tiles: [tile], columnCount: 2 };
}

/** Side-by-side pair. */
export function twoTileRow(
  first: ChartTileConfig,
  second: ChartTileConfig,
): CustomDashboardChartRow {
  return { tiles: [first, second], columnCount: 2 };
}
