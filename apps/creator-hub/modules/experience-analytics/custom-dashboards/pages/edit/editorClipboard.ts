import { getChartRowColumnCount, getChartRowTiles } from '../../layout/chartRow';
import {
  getChartRows,
  getSummaryCards,
  withChartRows,
  withSummaryCards,
} from '../../layout/dashboardLayout';
import {
  appendTileAsRow,
  collapseAdjacentHalfWidthRows,
  findTilePosition,
  flattenRows,
  type Rows,
} from '../../layout/rowLayout';
import {
  MAX_CHART_TILES_PER_DASHBOARD,
  MAX_SUMMARY_CARDS_PER_DASHBOARD,
  type ChartTileConfig,
  type CustomDashboardConfig,
  type CustomDashboardTile,
  type SummaryCardTileConfig,
  type TileId,
} from '../../types';
import { cloneTileWithNewId } from '../../utils/cloneTile';
import { createTileId } from '../../utils/createTileId';

export type SelectedCanvasTile =
  | { readonly type: 'SummaryCard'; readonly tileId: TileId }
  | { readonly type: 'Chart'; readonly tileId: TileId };

export type CanvasClipboardTile = SummaryCardTileConfig | ChartTileConfig;

type NextTileId = () => string;

export function getSelectedCanvasTile(
  config: CustomDashboardConfig,
  selectedTile: SelectedCanvasTile | null,
): CanvasClipboardTile | null {
  if (!selectedTile) {
    return null;
  }
  if (selectedTile.type === 'SummaryCard') {
    return getSummaryCards(config).find((tile) => tile.tileId === selectedTile.tileId) ?? null;
  }
  return (
    flattenRows(getChartRows(config)).find((tile) => tile.tileId === selectedTile.tileId) ?? null
  );
}

export function duplicateSummaryCard(
  summaryCards: ReadonlyArray<SummaryCardTileConfig>,
  tileId: TileId,
  nextTileId: NextTileId = createTileId,
): ReadonlyArray<SummaryCardTileConfig> {
  if (summaryCards.length >= MAX_SUMMARY_CARDS_PER_DASHBOARD) {
    return summaryCards;
  }
  const sourceIndex = summaryCards.findIndex((tile) => tile.tileId === tileId);
  const sourceTile = summaryCards[sourceIndex];
  if (!sourceTile) {
    return summaryCards;
  }
  const nextSummaryCards = [...summaryCards];
  nextSummaryCards.splice(sourceIndex + 1, 0, cloneTileWithNewId(sourceTile, nextTileId));
  return nextSummaryCards;
}

export function duplicateChartTileInRows(
  rows: Rows,
  tileId: TileId,
  nextTileId: NextTileId = createTileId,
): Rows {
  const sourceTile = flattenRows(rows).find((tile) => tile.tileId === tileId);
  if (!sourceTile) {
    return rows;
  }
  return pasteChartTileInRows(rows, sourceTile, tileId, nextTileId);
}

export function pasteChartTileInRows(
  rows: Rows,
  sourceTile: ChartTileConfig,
  selectedChartTileId: TileId | null,
  nextTileId: NextTileId = createTileId,
): Rows {
  if (flattenRows(rows).length >= MAX_CHART_TILES_PER_DASHBOARD) {
    return rows;
  }
  const pastedTile = cloneTileWithNewId(sourceTile, nextTileId);
  const position = selectedChartTileId ? findTilePosition(rows, selectedChartTileId) : null;
  if (!position) {
    return appendTileAsRow(rows, pastedTile);
  }
  const sourceRow = rows[position.rowIndex];
  const sourceTiles = getChartRowTiles(sourceRow);
  const sourceColumnCount = getChartRowColumnCount(sourceRow);
  if (sourceColumnCount === 2) {
    const nextTiles = [...sourceTiles];
    nextTiles.splice(position.itemIndex + 1, 0, pastedTile);
    const currentRowTiles = nextTiles.slice(0, 2);
    const overflowTiles = nextTiles.slice(2);
    return rows.flatMap((row, rowIndex) => {
      if (rowIndex !== position.rowIndex) {
        return [row];
      }
      return [
        { tiles: currentRowTiles, columnCount: sourceColumnCount },
        ...overflowTiles.map((tile) => ({ tiles: [tile], columnCount: sourceColumnCount })),
      ];
    });
  }
  const nextRows = [...rows];
  nextRows.splice(position.rowIndex + 1, 0, { tiles: [pastedTile], columnCount: 2 });
  return nextRows;
}

export function pasteCanvasTile(
  config: CustomDashboardConfig,
  clipboardTile: CanvasClipboardTile,
  selectedTile: SelectedCanvasTile | null,
  nextTileId: NextTileId = createTileId,
): CustomDashboardConfig {
  if (clipboardTile.type === 'SummaryCard') {
    const summaryCards = getSummaryCards(config);
    if (summaryCards.length >= MAX_SUMMARY_CARDS_PER_DASHBOARD) {
      return config;
    }
    const pastedTile = cloneTileWithNewId(clipboardTile, nextTileId);
    const selectedSummaryTileId = selectedTile?.type === 'SummaryCard' ? selectedTile.tileId : null;
    const sourceIndex = selectedSummaryTileId
      ? summaryCards.findIndex((tile) => tile.tileId === selectedSummaryTileId)
      : -1;
    const nextSummaryCards = [...summaryCards];
    nextSummaryCards.splice(
      sourceIndex >= 0 ? sourceIndex + 1 : nextSummaryCards.length,
      0,
      pastedTile,
    );
    return withSummaryCards(config, nextSummaryCards);
  }
  const selectedChartTileId = selectedTile?.type === 'Chart' ? selectedTile.tileId : null;
  const chartRows = getChartRows(config);
  const nextRows = pasteChartTileInRows(chartRows, clipboardTile, selectedChartTileId, nextTileId);
  if (nextRows === chartRows) {
    return config;
  }
  return withChartRows(config, collapseAdjacentHalfWidthRows(nextRows));
}

export function isSameSelectedCanvasTile(
  left: SelectedCanvasTile | null,
  right: SelectedCanvasTile | null,
): boolean {
  return left?.type === right?.type && left?.tileId === right?.tileId;
}

export function selectedTileFor(tile: CustomDashboardTile): SelectedCanvasTile {
  return { type: tile.type, tileId: tile.tileId };
}
