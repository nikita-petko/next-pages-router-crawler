import { makeStyles } from '@rbx/ui';

const useMakeAnythingStyles = makeStyles()((theme) => ({
  root: {
    position: 'relative',
    paddingTop: 48,
    width: '100%',
    '& img': {
      width: '100%',
      objectFit: 'fill',
      [theme.breakpoints.down('XLarge')]: {
        marginLeft: -32,
        width: 'calc(100% + 64px)',
        height: '60vh',
        objectFit: 'cover',
      },
      [theme.breakpoints.down('Medium')]: {
        margin: 'auto',
        width: '100%',
      },
    },
  },

  imageContainer: {
    width: '100%',
    maxHeight: 500,
    overflow: 'hidden',
  },

  contentContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '100%',
    maxWidth: 1250,
    padding: '0 10px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    '& h1': {
      textAlign: 'left',
      paddingBottom: 16,
      fontWeight: 450,
      [theme.breakpoints.up('XLarge')]: {
        fontSize: 60,
      },
    },
  },
}));

export default useMakeAnythingStyles;
