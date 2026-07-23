import clone from 'just-clone';
import type { ChartTileConfig, CustomDashboardTile, SummaryCardTileConfig } from '../types';
import { createTileId } from './createTileId';

/**
 * Deep-clone a tile with a fresh `tileId`. Two overloads preserve the variant
 * in the return type — every caller passes already-narrowed tiles (one row /
 * one summary card at a time), so a third union overload would just be dead
 * surface area. Delegating to `just-clone` keeps the copy correct as the tile
 * shape grows (e.g. richer filter or overlay types) without hand-maintaining a
 * per-field deep spread.
 */
export function cloneTileWithNewId(
  tile: SummaryCardTileConfig,
  nextTileId?: () => string,
): SummaryCardTileConfig;
export function cloneTileWithNewId(
  tile: ChartTileConfig,
  nextTileId?: () => string,
): ChartTileConfig;
export function cloneTileWithNewId(
  tile: CustomDashboardTile,
  nextTileId: () => string = createTileId,
): CustomDashboardTile {
  return { ...clone(tile), tileId: nextTileId() };
}
