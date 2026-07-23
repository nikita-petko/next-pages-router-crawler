/**
 * Pure row-based layout helpers (no I/O, no React, no DOM). The dashboard body
 * is an ordered list of `{ tiles, columnCount }` rows.
 */

import { ChartType } from '@modules/charts-generic/charts/types/ChartTypes';
import {
  MAX_TILES_PER_ROW,
  type ChartTileConfig,
  type CustomDashboardChartRow,
  type TileId,
} from '../types';
import {
  getChartRowColumnCount,
  getChartRowTiles,
  halfWidthRow,
  singleTileRow,
  twoTileRow,
} from './chartRow';

export type RowResizeSide = 'left' | 'right';

export type RowResizeAction =
  | {
      readonly type: 'full-width-to-half-width';
      readonly rowIndex: number;
    }
  | {
      readonly type: 'half-width-to-full-width';
      readonly rowIndex: number;
    }
  | {
      readonly type: 'row-item-to-full-width';
      readonly rowIndex: number;
      readonly itemIndex: number;
    };

export type Rows = ReadonlyArray<CustomDashboardChartRow>;

export type RowDragPreviewTarget =
  | { readonly type: 'tile'; readonly tileId: TileId }
  | { readonly type: 'empty-slot'; readonly rowIndex: number };

export function flattenRows(rows: Rows): ReadonlyArray<ChartTileConfig> {
  return rows.flatMap((row) => [...getChartRowTiles(row)]);
}

export type TilePosition = { readonly rowIndex: number; readonly itemIndex: number };

export function findTilePosition(rows: Rows, tileId: TileId): TilePosition | null {
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const tiles = getChartRowTiles(rows[rowIndex]);
    for (let itemIndex = 0; itemIndex < tiles.length; itemIndex += 1) {
      if (tiles[itemIndex].tileId === tileId) {
        return { rowIndex, itemIndex };
      }
    }
  }
  return null;
}

/**
 * A two-column row holding a single tile, i.e. it has one open slot that
 * another tile can drop into (drag-to-empty-slot) or be appended to.
 */
function hasOpenSecondSlot(row: CustomDashboardChartRow): boolean {
  return getChartRowColumnCount(row) === MAX_TILES_PER_ROW && getChartRowTiles(row).length === 1;
}

export function collapseAdjacentHalfWidthRows(rows: Rows): Rows {
  const next: CustomDashboardChartRow[] = [];
  let didCollapse = false;
  let rowIndex = 0;

  while (rowIndex < rows.length) {
    const row = rows[rowIndex];
    const nextRow = rows[rowIndex + 1];

    if (row && nextRow && hasOpenSecondSlot(row) && hasOpenSecondSlot(nextRow)) {
      next.push(twoTileRow(getChartRowTiles(row)[0], getChartRowTiles(nextRow)[0]));
      didCollapse = true;
      rowIndex += 2;
      continue;
    }

    next.push(row);
    rowIndex += 1;
  }

  return didCollapse ? next : rows;
}

/**
 * Validate a drag of `activeId` into the open slot of `targetRowIndex`,
 * resolving the dragged tile. Shared by the committed move and the drag
 * preview so both agree on what constitutes a legal empty-slot drop.
 */
function resolveEmptySlotMove(
  rows: Rows,
  activeId: TileId,
  targetRowIndex: number,
): { sourcePosition: TilePosition; activeTile: ChartTileConfig } | null {
  const sourcePosition = findTilePosition(rows, activeId);
  if (!sourcePosition || sourcePosition.rowIndex === targetRowIndex) {
    return null;
  }
  const targetRow = rows[targetRowIndex];
  if (!targetRow || !hasOpenSecondSlot(targetRow)) {
    return null;
  }
  const activeTile = getChartRowTiles(rows[sourcePosition.rowIndex])[sourcePosition.itemIndex];
  if (!activeTile) {
    return null;
  }
  return { sourcePosition, activeTile };
}

function removeTileForMove(
  rows: Rows,
  sourcePosition: TilePosition,
): { rowsWithoutActive: CustomDashboardChartRow[]; activeTile: ChartTileConfig } | null {
  const sourceRow = rows[sourcePosition.rowIndex];
  const activeTile = getChartRowTiles(sourceRow)[sourcePosition.itemIndex];
  if (!activeTile) {
    return null;
  }

  const rowsWithoutActive: CustomDashboardChartRow[] = [];
  rows.forEach((row, rowIndex) => {
    if (rowIndex !== sourcePosition.rowIndex) {
      rowsWithoutActive.push(row);
      return;
    }

    const remainingTiles = getChartRowTiles(row).filter(
      (_, itemIndex) => itemIndex !== sourcePosition.itemIndex,
    );
    if (remainingTiles.length === 0) {
      return;
    }
    rowsWithoutActive.push({
      tiles: remainingTiles,
      columnCount: getChartRowColumnCount(row),
    });
  });

  return { rowsWithoutActive, activeTile };
}

function insertHalfWidthTileIntoTargetRow(
  targetRow: CustomDashboardChartRow,
  activeTile: ChartTileConfig,
  targetItemIndex: number,
  insertAfterTarget: boolean,
): CustomDashboardChartRow[] {
  const nextTiles = [...getChartRowTiles(targetRow)];
  nextTiles.splice(targetItemIndex + (insertAfterTarget ? 1 : 0), 0, activeTile);
  const nextRows: CustomDashboardChartRow[] = [];
  for (let index = 0; index < nextTiles.length; index += MAX_TILES_PER_ROW) {
    nextRows.push({ tiles: nextTiles.slice(index, index + MAX_TILES_PER_ROW), columnCount: 2 });
  }
  return nextRows;
}

function insertFullWidthTileAroundTargetRow(
  targetRow: CustomDashboardChartRow,
  activeTile: ChartTileConfig,
  targetItemIndex: number,
  insertAfterTarget: boolean,
): CustomDashboardChartRow[] {
  const targetTiles = getChartRowTiles(targetRow);
  if (targetTiles.length === 1) {
    return insertAfterTarget
      ? [targetRow, singleTileRow(activeTile)]
      : [singleTileRow(activeTile), targetRow];
  }

  if (!insertAfterTarget && targetItemIndex === 0) {
    return [singleTileRow(activeTile), targetRow];
  }
  if (insertAfterTarget && targetItemIndex === targetTiles.length - 1) {
    return [targetRow, singleTileRow(activeTile)];
  }

  const beforeTiles = targetTiles.slice(0, targetItemIndex + (insertAfterTarget ? 1 : 0));
  const afterTiles = targetTiles.slice(targetItemIndex + (insertAfterTarget ? 1 : 0));
  return [
    ...(beforeTiles.length > 0 ? [{ tiles: beforeTiles, columnCount: 2 as const }] : []),
    singleTileRow(activeTile),
    ...(afterTiles.length > 0 ? [{ tiles: afterTiles, columnCount: 2 as const }] : []),
  ];
}

export function moveTileToTile(rows: Rows, activeId: TileId, overId: TileId): Rows {
  if (activeId === overId) {
    return rows;
  }

  const sourcePosition = findTilePosition(rows, activeId);
  const targetPosition = findTilePosition(rows, overId);
  if (!sourcePosition || !targetPosition) {
    return rows;
  }

  const flat = flattenRows(rows);
  const oldIndex = flat.findIndex((tile) => tile.tileId === activeId);
  const newIndex = flat.findIndex((tile) => tile.tileId === overId);
  if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) {
    return rows;
  }

  const sourceColumnCount = getChartRowColumnCount(rows[sourcePosition.rowIndex]);
  const removed = removeTileForMove(rows, sourcePosition);
  if (!removed) {
    return rows;
  }
  const { rowsWithoutActive, activeTile } = removed;
  const adjustedTargetPosition = findTilePosition(rowsWithoutActive, overId);
  if (!adjustedTargetPosition) {
    return rows;
  }

  const insertAfterTarget = oldIndex < newIndex;
  const targetRow = rowsWithoutActive[adjustedTargetPosition.rowIndex];
  const insertedRows =
    sourceColumnCount === 1
      ? insertFullWidthTileAroundTargetRow(
          targetRow,
          activeTile,
          adjustedTargetPosition.itemIndex,
          insertAfterTarget,
        )
      : getChartRowColumnCount(targetRow) === 1
        ? insertAfterTarget
          ? [targetRow, halfWidthRow(activeTile)]
          : [halfWidthRow(activeTile), targetRow]
        : insertHalfWidthTileIntoTargetRow(
            targetRow,
            activeTile,
            adjustedTargetPosition.itemIndex,
            insertAfterTarget,
          );

  return rowsWithoutActive.flatMap((row, rowIndex) =>
    rowIndex === adjustedTargetPosition.rowIndex ? insertedRows : [row],
  );
}

export function moveTileToEmptySlot(rows: Rows, activeId: TileId, targetRowIndex: number): Rows {
  const resolved = resolveEmptySlotMove(rows, activeId, targetRowIndex);
  if (!resolved) {
    return rows;
  }
  const { sourcePosition, activeTile } = resolved;

  const next: CustomDashboardChartRow[] = [];
  rows.forEach((row, rowIndex) => {
    if (rowIndex === sourcePosition.rowIndex) {
      const remainingTiles = getChartRowTiles(row).filter(
        (_, idx) => idx !== sourcePosition.itemIndex,
      );
      if (remainingTiles.length === 1) {
        next.push(halfWidthRow(remainingTiles[0]));
      }
      return;
    }
    if (rowIndex === targetRowIndex) {
      next.push(twoTileRow(getChartRowTiles(row)[0], activeTile));
      return;
    }
    next.push(row);
  });

  return next;
}

export function getChartDragPreviewRows(
  rows: Rows,
  activeId: TileId | null,
  target: RowDragPreviewTarget | null,
): Rows | null {
  if (!activeId || !target) {
    return null;
  }
  if (target.type === 'empty-slot') {
    const nextRows = moveTileToEmptySlot(rows, activeId, target.rowIndex);
    return nextRows === rows ? null : collapseAdjacentHalfWidthRows(nextRows);
  }
  const nextRows = target.type === 'tile' ? moveTileToTile(rows, activeId, target.tileId) : rows;
  return nextRows === rows ? null : collapseAdjacentHalfWidthRows(nextRows);
}

export function getResizeHandlesForTile(rows: Rows, tileId: TileId): RowResizeSide[] {
  const position = findTilePosition(rows, tileId);
  if (!position) {
    return [];
  }
  const { rowIndex, itemIndex } = position;
  const row = rows[rowIndex];
  const tiles = getChartRowTiles(row);

  if (tiles.length === 1) {
    return ['right'];
  }
  if (itemIndex === 0) {
    return ['right'];
  }
  if (itemIndex === tiles.length - 1) {
    return ['left'];
  }
  return ['left', 'right'];
}

export function getResizeAction(
  rows: Rows,
  tileId: TileId,
  side: RowResizeSide,
): RowResizeAction | null {
  const position = findTilePosition(rows, tileId);
  if (!position) {
    return null;
  }
  const { rowIndex, itemIndex } = position;
  const row = rows[rowIndex];
  const tiles = getChartRowTiles(row);
  const columnCount = getChartRowColumnCount(row);

  if (tiles.length === 1 && columnCount === 1) {
    return side === 'right' ? { type: 'full-width-to-half-width', rowIndex } : null;
  }
  if (tiles.length === 1 && columnCount === MAX_TILES_PER_ROW) {
    return side === 'right' ? { type: 'half-width-to-full-width', rowIndex } : null;
  }
  if (itemIndex === 0 && side === 'right') {
    return { type: 'row-item-to-full-width', rowIndex, itemIndex };
  }
  if (itemIndex === tiles.length - 1 && side === 'left') {
    return { type: 'row-item-to-full-width', rowIndex, itemIndex };
  }
  return null;
}

export function applyResizeAction(rows: Rows, action: RowResizeAction): Rows {
  const next: CustomDashboardChartRow[] = rows.map((row) => ({
    tiles: [...getChartRowTiles(row)],
    columnCount: getChartRowColumnCount(row),
  }));

  if (action.type === 'full-width-to-half-width') {
    const currentRow = next[action.rowIndex];
    if (!currentRow || currentRow.tiles.length !== 1 || currentRow.columnCount !== 1) {
      return rows;
    }
    next[action.rowIndex] = halfWidthRow(currentRow.tiles[0]);
    return next;
  }

  if (action.type === 'half-width-to-full-width') {
    const currentRow = next[action.rowIndex];
    if (!currentRow || currentRow.tiles.length !== 1 || currentRow.columnCount !== 2) {
      return rows;
    }
    next[action.rowIndex] = singleTileRow(currentRow.tiles[0]);
    return next;
  }

  const sourceRow = next[action.rowIndex];
  const tiles = sourceRow?.tiles;
  const resizedTile = tiles?.[action.itemIndex];
  const siblingTile = tiles?.[action.itemIndex === 0 ? 1 : 0];
  if (!tiles || tiles.length !== 2 || sourceRow.columnCount !== 2 || !resizedTile || !siblingTile) {
    return rows;
  }
  if (action.itemIndex === 0) {
    next[action.rowIndex] = singleTileRow(resizedTile);
    next.splice(action.rowIndex + 1, 0, halfWidthRow(siblingTile));
    return next;
  }
  next[action.rowIndex] = halfWidthRow(siblingTile);
  next.splice(action.rowIndex + 1, 0, singleTileRow(resizedTile));
  return next;
}

export function canAppendTileToLastRow(rows: Rows): boolean {
  const lastRow = rows[rows.length - 1];
  return !!lastRow && hasOpenSecondSlot(lastRow);
}

export function appendTileAsRow(rows: Rows, tile: ChartTileConfig): Rows {
  // Tables are wide (breakdown columns + pagination) and should not share a
  // half-width row with the Add Chart empty slot — match Explore's full-width
  // `addChartTileToConfig` path.
  if (tile.chartSpec.chartType === ChartType.Table) {
    return [...rows, singleTileRow(tile)];
  }
  if (!canAppendTileToLastRow(rows)) {
    return [...rows, halfWidthRow(tile)];
  }

  return rows.map((row, rowIndex) => {
    if (rowIndex !== rows.length - 1) {
      return row;
    }
    return twoTileRow(getChartRowTiles(row)[0], tile);
  });
}

export function removeTile(rows: Rows, tileId: TileId): Rows {
  const position = findTilePosition(rows, tileId);
  if (!position) {
    return rows;
  }
  const { rowIndex, itemIndex } = position;
  const next: CustomDashboardChartRow[] = [];
  rows.forEach((row, idx) => {
    if (idx !== rowIndex) {
      next.push(row);
      return;
    }
    const filtered = getChartRowTiles(row).filter((_, i) => i !== itemIndex);
    if (filtered.length === 0) {
      return;
    }
    const columnCount = filtered.length >= 2 ? 2 : (1 as const);
    next.push({ tiles: filtered, columnCount });
  });
  return next;
}

export function replaceTile(rows: Rows, tileId: TileId, replacement: ChartTileConfig): Rows {
  const position = findTilePosition(rows, tileId);
  if (!position) {
    return rows;
  }
  return rows.map((row, rowIdx) => {
    if (rowIdx !== position.rowIndex) {
      return row;
    }
    return {
      ...row,
      tiles: getChartRowTiles(row).map((tile, itemIdx) =>
        itemIdx === position.itemIndex ? replacement : tile,
      ),
    };
  });
}

export { MAX_TILES_PER_ROW };
export { halfWidthRow, singleTileRow, twoTileRow } from './chartRow';
