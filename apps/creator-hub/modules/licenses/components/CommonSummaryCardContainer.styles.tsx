import { makeStyles } from '@rbx/ui';

const useCommonSummaryCardContainerStyles = makeStyles()((theme) => ({
  summaryContainer: {
    width: '100%',
    maxWidth: 618,
  },

  thumbnailContainer: {
    width: '327px',
    height: '222px',
  },

  loadingThumbnail: {
    ...theme.border.radius.small,
    width: '327px',
    height: '222px',
  },

  thumbnail: {
    ...theme.border.radius.small,
    display: 'inline-block',
  },

  detailsContainer: {
    height: 150,
    minWidth: 200,
    maxWidth: 460,
    padding: '20px 12px 6px 0px',
    width: '100%',
  },
}));

export default useCommonSummaryCardContainerStyles;
