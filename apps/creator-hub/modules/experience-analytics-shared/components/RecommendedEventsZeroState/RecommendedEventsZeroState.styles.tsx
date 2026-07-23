import { makeStyles } from '@rbx/ui';

const useRecommendedEventsZeroStateStyles = makeStyles()((theme) => ({
  grid: {
    borderRadius: '12px',
    overflow: 'hidden',
    backgroundColor: theme.palette.surface[200],
  },

  textContainer: {
    margin: '52px 40px 68px',
    [theme.breakpoints.down('Large')]: {
      margin: '24px 16px',
    },
  },

  zeroStateImageContainer: {
    position: 'relative',
    minWidth: '530px',
  },

  zeroStateImage: {
    width: '530px',
    [theme.breakpoints.up('Large')]: {
      position: 'absolute',
      top: '-10px',
      right: '-10px',
    },
    [theme.breakpoints.down('Large')]: {
      position: 'relative',
      display: 'block',
      margin: 'auto',
    },
  },

  zeroStateImageCentered: {
    minWidth: '0',
    maxWidth: '530px',
    maxHeight: '250px',
    margin: '35px',
  },

  actionButton: {
    marginTop: '24px',
  },
}));

export default useRecommendedEventsZeroStateStyles;
