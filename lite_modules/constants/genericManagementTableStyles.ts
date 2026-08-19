import { paddingUnit } from '@constants/styleConstants';

export const defaultAlign = 'center';

export const SKELETON_ROWS_COUNT = 5;

/** Block / inline padding for management table body cells (`nameRow`, etc.). */
const ROW_PADDING_BLOCK_PX = 8;
const ROW_PADDING_INLINE_PX = 16;

export const rowPadding = {
  padding: `${ROW_PADDING_BLOCK_PX}px ${ROW_PADDING_INLINE_PX}px`,
};

/**
 * Background for sticky / pinned management-table cells. Must be fully opaque so
 * scrolled columns can't show through, and referenced as a CSS custom property
 * rather than `theme.palette` because the consuming style objects live at module
 * scope, outside any component.
 */
export const stickyCellBackgroundColor = 'var(--color-surface-0)';

/** Sum of left + right inline padding from `rowPadding` (used for name column min-width measurement). */
export const rowPaddingHorizontalTotalPx = ROW_PADDING_INLINE_PX * 2;

/**
 * Default `SvgIcon` box at `fontSize="medium"` (TableNameCell uses uncapped `Cached` / `VisibilityOff`).
 * Matches MUI `SvgIcon` medium dimensions.
 */
const TABLE_NAME_CELL_MUI_ICON_MEDIUM_PX = 24;

/** Width reserved per optional leading icon: icon box + `TableNameCell` `autoReloadIcon` padding. */
export const campaignTableNameCellIconSlotWidthPx =
  TABLE_NAME_CELL_MUI_ICON_MEDIUM_PX + paddingUnit;

export const textEllipsisTypographyStyles = {
  display: 'inline-block',
  maxWidth: '35vw',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};
