import { getChartRows, withChartRows } from '../layout/dashboardLayout';
import { singleTileRow } from '../layout/rowLayout';
import type { ChartTileConfig, CustomDashboardConfig } from '../types';
import { validateCustomDashboardConfig } from './validators';

export type AddChartTileToConfigResult = {
  readonly config: CustomDashboardConfig;
  readonly tile: ChartTileConfig;
};

/**
 * Append an externally captured chart as a new full-width row at the bottom.
 * The service/backend owns the final tile id so callers can safely pass a
 * temporary id from a configurator preview.
 */
export function addChartTileToConfig({
  config,
  tile,
  nextTileId,
}: {
  readonly config: CustomDashboardConfig;
  readonly tile: ChartTileConfig;
  readonly nextTileId: string;
}): AddChartTileToConfigResult {
  const persistedTile: ChartTileConfig = {
    ...tile,
    tileId: nextTileId,
  };
  const nextConfig = validateCustomDashboardConfig(
    withChartRows(config, [...getChartRows(config), singleTileRow(persistedTile)]),
  );
  return {
    config: nextConfig,
    tile: persistedTile,
  };
}
