import type { CSSProperties } from 'react';
import { CUSTOM_DASHBOARD_CHART_TILE_HEIGHT_PX } from '../../../layout/chartTileDimensions';

/**
 * Inline style objects for the dashboard editor canvas. Kept as module-scope
 * constants (rather than recreated per render) and grouped here to keep
 * `EditPageCanvas` focused on behaviour. Figma node references are noted inline.
 */

// Border width is 2px (not 1px) because dashed dash length is proportional to
// stroke width — at 1px the row reads as a solid line.
// Figma node 2384-62450: 24px padding/gaps around the workspace (`--size-600`).
const WORKSPACE_GAP_PX = 24;

export const canvasContainerStyle: CSSProperties = {
  borderRadius: 12,
  border: '2px dashed var(--color-stroke-default)',
  background: 'var(--color-surface-0)',
  padding: WORKSPACE_GAP_PX,
  gap: WORKSPACE_GAP_PX,
};

const addPlaceholderBorderStyle: CSSProperties = {
  borderRadius: 12,
  border: '1px solid var(--color-stroke-default)',
  background: 'transparent',
};

const emptySkeletonBorderStyle: CSSProperties = {
  borderRadius: 12,
  border: '2px dashed var(--color-stroke-default)',
  background: 'transparent',
};

// `boxSizing: 'border-box'` is set explicitly because Foundation's tailwind
// preset disables preflight; without it a `<button>` placeholder and `<div>`
// skeleton render at different outer widths even with the same fixed width.
// Figma node 2384-62450: summary cards use 24px gaps in the workspace.
const SUMMARY_TILE_MIN_HEIGHT_PX = 95;
export const SUMMARY_ROW_GAP_PX = WORKSPACE_GAP_PX;
export const SUMMARY_TILE_MIN_WIDTH_PX = 280;
export const summaryTileConfiguredSizeStyle: CSSProperties = {
  minWidth: 0,
  width: '100%',
  boxSizing: 'border-box',
};
const summaryTileAddCardSizeStyle: CSSProperties = {
  ...summaryTileConfiguredSizeStyle,
  minHeight: SUMMARY_TILE_MIN_HEIGHT_PX,
  height: '100%',
};
// The summary grid and narrow chart-preview override live in `EditPageCanvas.module.css`;
// the chart canvas grid uses Foundation Tailwind utilities on its `<section>`.

export const tileChromeHostStyle: CSSProperties = {
  position: 'relative',
};

// Inline (non-overlay) chrome row used inside the chart card's existing
// top-right `CardActions` slot — fed in via `ChartActionsProvider`,
// so the surrounding ChartCard owns positioning and we just supply the
// edit pencil + 3-dot menu pair.
export const inlineTileChromeStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  gap: 4,
};

// Summary-card mounts install chrome via `SummaryCardHeaderActionsProvider`
// into GenericSummaryCard's title row (same flex alignment as the label).
// Keep this as a plain inline flex row — not absolutely positioned.
export const summaryTileChromeStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
};

export const summaryAddPlaceholderStyle: CSSProperties = {
  ...summaryTileAddCardSizeStyle,
  ...addPlaceholderBorderStyle,
  background: 'var(--color-surface-0)',
  padding: '21px 26px',
  gap: 8,
  justifyContent: 'center',
  cursor: 'pointer',
  appearance: 'none',
  color: 'var(--color-content-default)',
  textAlign: 'left',
};

export const summaryAddPlaceholderIconStyle: CSSProperties = {
  width: 32,
  height: 32,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 8,
};

export const summarySkeletonStyle: CSSProperties = {
  ...summaryTileAddCardSizeStyle,
  ...emptySkeletonBorderStyle,
  padding: '16px 20px',
  gap: 8,
};

// Tiles live inside CSS-grid row containers; grid tracks are strictly equal
// regardless of children's intrinsic widths, which flexbox `flex: 1 1 0` is
// supposed to do but doesn't always (native `<button>` perturbs the math).
// Figma node 2384-62450: chart tiles use 24px row/column gaps in the workspace.
const CHART_TILE_HEIGHT_PX = CUSTOM_DASHBOARD_CHART_TILE_HEIGHT_PX;
export const CHART_COLUMN_GAP_PX = WORKSPACE_GAP_PX;
const chartTileBaseStyle: CSSProperties = {
  minWidth: 0,
  width: '100%',
  height: CHART_TILE_HEIGHT_PX,
  boxSizing: 'border-box',
};
export const chartFullWidthCellStyle: CSSProperties = {
  gridColumn: '1 / -1',
};
export const chartHalfWidthCellStyle: CSSProperties = {
  gridColumn: 'span 1',
};

export const chartTileMountStyle: CSSProperties = {
  ...chartTileBaseStyle,
};

/** Tables size to their paginated content instead of the fixed chart-card height. */
export const chartTableTileMountStyle: CSSProperties = {
  minWidth: 0,
  width: '100%',
  height: 'auto',
  boxSizing: 'border-box',
};

const CHART_ADD_PLACEHOLDER_CONTENT_GAP_PX = 50;
const CHART_ADD_PLACEHOLDER_COPY_MAX_WIDTH_PX = 383;

export const chartAddPlaceholderCardStyle: CSSProperties = {
  ...chartTileBaseStyle,
  ...addPlaceholderBorderStyle,
  background: 'var(--color-surface-0)',
  overflow: 'hidden',
  padding: '91px',
  gap: CHART_ADD_PLACEHOLDER_CONTENT_GAP_PX,
};

export const chartAddPlaceholderCopyStyle: CSSProperties = {
  maxWidth: CHART_ADD_PLACEHOLDER_COPY_MAX_WIDTH_PX,
  gap: 8,
};

export const chartAddPlaceholderActionsStyle: CSSProperties = {
  gap: 16,
};
