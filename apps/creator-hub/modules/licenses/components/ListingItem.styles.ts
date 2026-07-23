import { makeStyles } from '@rbx/ui';

const useListingItemStyles = makeStyles()((theme) => ({
  thumbnailContainer: {
    ...theme.border.radius.medium,
    height: '181px',
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
  },

  thumbnail: {
    // bypass the <span> element so we use the parent
    // thumbnailContainer instead
    position: 'static',
  },

  plainImageThumbnail: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },

  thumbnailImage: {
    objectFit: 'cover',
  },
}));

export default useListingItemStyles;
