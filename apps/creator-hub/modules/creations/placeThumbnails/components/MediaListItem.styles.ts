import { makeStyles } from '@rbx/ui';

const useMediaListItemStyles = makeStyles()((theme) => ({
  avatar: {
    marginRight: 16,
  },

  imageContainer: {
    width: '100%',
    height: 0,
    paddingTop: '100%',
    position: 'relative',
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: theme.palette.filledInputBackground,
  },

  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    left: '0',
    bottom: '0',
    objectFit: 'contain',
  },
}));

export default useMediaListItemStyles;
