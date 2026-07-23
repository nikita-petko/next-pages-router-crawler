import { makeStyles } from '@rbx/ui';

const useItemThumbnailStyles = makeStyles()((theme) => ({
  thumbnailWithBackground: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    backgroundColor: theme.palette.actionV2.secondary.fill,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
}));

export default useItemThumbnailStyles;
