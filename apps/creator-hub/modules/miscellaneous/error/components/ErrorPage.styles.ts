import { makeStyles } from '@rbx/ui';

const fullWidthHeight = {
  width: '100%',
  height: '100%',
};

const imageHeights = {
  large: '376px',
  compact: '240px',
};

const usePageNotFoundStyles = makeStyles()((theme) => ({
  root: {
    ...fullWidthHeight,
  },

  background: {
    maxWidth: 1024,
  },

  guestErrorArea: {
    padding: theme.spacing(5, 5, 4),
  },

  loggedinErrorArea: {
    padding: theme.spacing(2, 2, 4),
  },

  errorImage: {
    ...fullWidthHeight,
    maxWidth: imageHeights.large,
    maxHeight: imageHeights.large,
    [theme.breakpoints.down('Medium')]: {
      width: imageHeights.compact,
      height: imageHeights.compact,
    },
  },

  textHeader: {
    paddingBottom: theme.spacing(1),
  },

  guestImageArea: {
    padding: theme.spacing(5, 5),
  },

  loggedinImageArea: {
    padding: theme.spacing(2, 2),
  },
}));

export default usePageNotFoundStyles;
