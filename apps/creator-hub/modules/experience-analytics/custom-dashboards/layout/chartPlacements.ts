import {
  MAX_TILES_PER_ROW,
  type ChartTileConfig,
  type CustomDashboardChartRow,
  type CustomDashboardChartRowColumnCount,
  type DashboardFlexLayout,
  type DashboardGridLayout,
  type DashboardLayoutNode,
  type DashboardStackLayout,
  type TileId,
} from '../types';
import { getChartRowColumnCount, getChartRowTiles } from './chartRow';

const EMPTY_CHART_SLOT_PREFIX = 'chart-empty-slot:';

export type EmptyChartSlotTarget = {
  readonly rowIndex: number;
};

export type ChartTilePlacement = {
  readonly kind: 'tile';
  readonly tileId: TileId;
  readonly tile: ChartTileConfig;
  readonly rowIndex: number;
  readonly itemIndex: number;
  readonly order: number;
  readonly columnSpan: 1 | 2;
};

export type ChartEmptySlotPlacement = {
  readonly kind: 'empty-slot';
  readonly emptySlotId: string;
  readonly rowIndex: number;
  readonly order: number;
  readonly columnSpan: 1;
  readonly isAddPlaceholderSlot: boolean;
};

export type ChartPlacement = ChartTilePlacement | ChartEmptySlotPlacement;

export const getEmptyChartSlotId = (rowIndex: number): string =>
  `${EMPTY_CHART_SLOT_PREFIX}${rowIndex}`;

export const getEmptyChartSlotTarget = (id: string | null): EmptyChartSlotTarget | null => {
  if (!id?.startsWith(EMPTY_CHART_SLOT_PREFIX)) {
    return null;
  }
  const rowIndex = Number.parseInt(id.slice(EMPTY_CHART_SLOT_PREFIX.length), 10);
  return Number.isInteger(rowIndex) && rowIndex >= 0 ? { rowIndex } : null;
};

const canUseLastRowEmptySlotForAddPlaceholder = (
  rows: ReadonlyArray<CustomDashboardChartRow>,
): boolean => {
  const lastRow = rows[rows.length - 1];
  return (
    !!lastRow && getChartRowColumnCount(lastRow) === 2 && getChartRowTiles(lastRow).length === 1
  );
};

const getChartTileFromNode = (node: DashboardLayoutNode): ChartTileConfig | null =>
  node.type === 'Component' && node.component.type === 'Chart' ? node.component.chart : null;

const chartTilesFromChildren = (
  children: ReadonlyArray<DashboardLayoutNode>,
): ReadonlyArray<ChartTileConfig> | null => {
  const tiles = children.map(getChartTileFromNode);
  return tiles.length > 0 && tiles.every((tile) => tile !== null)
    ? tiles.filter((tile): tile is ChartTileConfig => tile !== null)
    : null;
};

function assertCanonicalColumnCount(
  columnCount: number,
): asserts columnCount is CustomDashboardChartRowColumnCount {
  if (columnCount !== 1 && columnCount !== MAX_TILES_PER_ROW) {
    throw new Error(
      `Malformed dashboard layout: chart row columnCount must be 1 or ${MAX_TILES_PER_ROW}, received ${columnCount}.`,
    );
  }
}

/**
 * Canonical chart-row normalization. A chart "row" may be authored as a Grid
 * (which declares its own column count), or as a Flex/Stack container (where the
 * column count is implied by the tile count). All three container kinds funnel
 * through here so a 2-column row is represented identically — as a 2-column Grid
 * row in the layout model — regardless of the source container type. Malformed
 * column counts or empty rows fail loudly rather than silently mis-parsing.
 */
function normalizeChartTilesToRows(
  tiles: ReadonlyArray<ChartTileConfig>,
  columnCount: CustomDashboardChartRowColumnCount,
): ReadonlyArray<CustomDashboardChartRow> {
  assertCanonicalColumnCount(columnCount);
  if (tiles.length === 0) {
    throw new Error('Malformed dashboard layout: a chart row must contain at least one tile.');
  }
  if (columnCount === 1) {
    return tiles.map((tile) => ({ columnCount, tiles: [tile] }));
  }
  const rows: CustomDashboardChartRow[] = [];
  for (let index = 0; index < tiles.length; index += MAX_TILES_PER_ROW) {
    rows.push({ columnCount, tiles: tiles.slice(index, index + MAX_TILES_PER_ROW) });
  }
  return rows;
}

/**
 * Resolve a chart row's canonical column count. A Grid is authoritative (it is
 * the only container able to express a half-width single tile, i.e. columnCount
 * 2 with one tile). Flex/Stack carry no column metadata, so a multi-tile row is
 * canonically a 2-column Grid and a lone tile is full-width.
 */
function deriveChartRowColumnCount(
  node: DashboardGridLayout | DashboardFlexLayout | DashboardStackLayout,
  chartTiles: ReadonlyArray<ChartTileConfig>,
): CustomDashboardChartRowColumnCount {
  if (node.type === 'Grid') {
    return node.columnCount;
  }
  return chartTiles.length > 1 ? MAX_TILES_PER_ROW : 1;
}

export function selectChartRowsFromLayoutNodes(
  nodes: ReadonlyArray<DashboardLayoutNode>,
): ReadonlyArray<CustomDashboardChartRow> {
  return nodes.flatMap((node) => {
    if (node.type === 'Component') {
      const chart = getChartTileFromNode(node);
      return chart ? [{ columnCount: 1 as const, tiles: [chart] }] : [];
    }

    const chartTiles = chartTilesFromChildren(node.children);
    if (chartTiles) {
      return normalizeChartTilesToRows(chartTiles, deriveChartRowColumnCount(node, chartTiles));
    }

    return selectChartRowsFromLayoutNodes(node.children);
  });
}

export function selectChartPlacements(
  rows: ReadonlyArray<CustomDashboardChartRow>,
): ReadonlyArray<ChartPlacement> {
  const useTrailingEmptySlotForAddPlaceholder = canUseLastRowEmptySlotForAddPlaceholder(rows);
  const placements: ChartPlacement[] = [];
  let order = 0;

  rows.forEach((row, rowIndex) => {
    const tiles = getChartRowTiles(row);
    const columnCount = getChartRowColumnCount(row);
    const columnSpan = columnCount === 1 ? 2 : 1;
    tiles.forEach((tile, itemIndex) => {
      placements.push({
        kind: 'tile',
        tileId: tile.tileId,
        tile,
        rowIndex,
        itemIndex,
        order,
        columnSpan,
      });
      order += 1;
    });

    if (columnCount <= tiles.length) {
      return;
    }

    placements.push({
      kind: 'empty-slot',
      emptySlotId: getEmptyChartSlotId(rowIndex),
      rowIndex,
      order,
      columnSpan: 1,
      isAddPlaceholderSlot: useTrailingEmptySlotForAddPlaceholder && rowIndex === rows.length - 1,
    });
    order += 1;
  });

  return placements;
}
