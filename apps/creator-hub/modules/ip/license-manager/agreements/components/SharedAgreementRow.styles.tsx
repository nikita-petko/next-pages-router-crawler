import { makeStyles } from '@rbx/ui';

const useSharedAgreementRowStyles = makeStyles()((theme) => ({
  twoColumnGrid: {
    display: 'grid',
    gridTemplateColumns: '77px 160px',
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
    minWidth: 140,
  },
}));

export default useSharedAgreementRowStyles;
