import { makeStyles } from '@rbx/ui';

/** Fixed tile height to match the sales-avenue field resolved state. */
const SALES_AVENUE_TILE_HEIGHT_PX = 58;

/** Thumbnail size in the review-step sales-avenue tile (matches 50x50 asset thumbnail). */
const THUMBNAIL_SIZE_PX = 40;

const useSalesAvenueResolvedTileStyles = makeStyles()((theme) => ({
  tileRoot: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    height: SALES_AVENUE_TILE_HEIGHT_PX,
    minHeight: SALES_AVENUE_TILE_HEIGHT_PX,
    maxHeight: SALES_AVENUE_TILE_HEIGHT_PX,
    width: '100%',
    padding: 0,
    boxSizing: 'border-box',
  },
  thumbnailContainer: {
    width: THUMBNAIL_SIZE_PX,
    height: THUMBNAIL_SIZE_PX,
    flexShrink: 0,
    display: 'block',
    padding: 0,
    borderRadius: '50%',
    overflow: 'hidden',
  },
}));

export default useSalesAvenueResolvedTileStyles;
