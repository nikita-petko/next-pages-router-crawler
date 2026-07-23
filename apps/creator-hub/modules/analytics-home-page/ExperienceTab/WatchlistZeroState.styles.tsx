import { makeStyles } from '@rbx/ui';

const useWatchlistZeroStateStyles = makeStyles()((theme) => ({
  grid: {
    border: `1px solid ${theme.palette.surface.outline}`,
    borderRadius: '12px',
    height: '320px',
    padding: '32px',
    overflow: 'hidden',
  },

  watchlistImageContainer: {
    position: 'relative',
  },

  watchlistImage: {
    position: 'absolute',
    top: '32px',
    left: '100px',
    [theme.breakpoints.down('Large')]: {
      top: '0',
      left: '-40px',
    },
  },
}));

export default useWatchlistZeroStateStyles;
