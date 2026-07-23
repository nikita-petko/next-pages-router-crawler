import { makeStyles } from '@rbx/ui';

/** First column width in `twoColumnGrid` (px); loading skeleton height matches 16:9 at this width. */
export const AGREEMENT_ROW_THUMBNAIL_GRID_FIRST_COL_WIDTH_PX = 77;

export const AGREEMENT_ROW_THUMBNAIL_SKELETON_HEIGHT_PX = Math.round(
  (AGREEMENT_ROW_THUMBNAIL_GRID_FIRST_COL_WIDTH_PX * 9) / 16,
);

/** Second column width in `twoColumnGrid` (px). */
export const AGREEMENT_ROW_TEXT_COL_WIDTH_PX = 160;

/** Tailwind for loading skeleton thumbnail blocks (approximates `thumbnailContainer` in makeStyles). */
export const AGREEMENT_ROW_THUMBNAIL_SKELETON_CLASSNAME = 'rounded-sm pt-0 aspect-video';

/**
 * Minimum width (px) for the IP family name cell so typical names do not collapse before truncation.
 */
export const AGREEMENT_ROW_IP_FAMILY_NAME_MIN_WIDTH_PX = 140;

const useSharedAgreementRowStyles = makeStyles()((theme) => ({
  twoColumnGrid: {
    display: 'grid',
    gridTemplateColumns: `${AGREEMENT_ROW_THUMBNAIL_GRID_FIRST_COL_WIDTH_PX}px ${AGREEMENT_ROW_TEXT_COL_WIDTH_PX}px`,
    gap: 12,
    alignItems: 'center',
  },

  thumbnailContainer: {
    ...theme.border.radius.small,
    paddingTop: 0,
    aspectRatio: '16 / 9',
  },

  thumbnailImage: {
    objectFit: 'cover',
  },

  truncateTwoLines: {
    WebkitLineClamp: 2,
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  truncateSingleLine: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  ipFamilyName: {
    minWidth: AGREEMENT_ROW_IP_FAMILY_NAME_MIN_WIDTH_PX,
  },
}));

export default useSharedAgreementRowStyles;
