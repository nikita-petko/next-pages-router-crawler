import { makeStyles } from '@rbx/ui';

const useStudioOverviewStyles = makeStyles()((theme) => ({
  root: {
    position: 'relative',
    padding: '0 10px',
    maxWidth: 1250,
    margin: 'auto',
  },

  heading: {
    marginBottom: 32,
  },

  video: {
    width: '100%',
    borderRadius: 8,
    height: 700,
    [theme.breakpoints.down('XLarge')]: {
      height: '100%',
    },
  },

  informationContainer: {
    [theme.breakpoints.down('XLarge')]: {
      display: 'flex',
      flexWrap: 'wrap',
    },
  },

  information: {
    position: 'absolute',
    padding: 20,
    background:
      'linear-gradient(#171717, #171717) padding-box, linear-gradient(112.39deg, #8DD6FF 8.02%, #008BDB 31.35%, #2E0998 93.26%) border-box',
    border: '2px solid transparent',
    borderRadius: 8,
    backgroundColor: theme.palette.surface[0],
    [theme.breakpoints.down('XLarge')]: {
      padding: '20px 0',
      position: 'relative',
      background: 'none',
      marginTop: 16,
    },
    '&#robloxStudioEngine': {
      [theme.breakpoints.up('XLarge')]: {
        top: '20vh',
        left: '3vw',
        width: 300,
      },
    },
    '&#rapidIteration': {
      [theme.breakpoints.up('XLarge')]: {
        top: '30vh',
        right: '2vw',
        width: 300,
      },
      [theme.breakpoints.down('XLarge')]: {
        width: '50%',
      },
      [theme.breakpoints.down('Medium')]: {
        width: '100%',
      },
    },
    '&#noUpfrontCosts': {
      [theme.breakpoints.up('XLarge')]: {
        bottom: '-1vh',
        left: '20vw',
        width: 300,
        background:
          'linear-gradient(#171717, #171717) padding-box, linear-gradient(267.1deg, #8DD6FF -11.42%, #008BDB 35.15%, #2E0998 158.71%) border-box',
      },
      [theme.breakpoints.down('XLarge')]: {
        width: '50%',
      },
      [theme.breakpoints.down('Medium')]: {
        width: '100%',
      },
    },
    '& h5': {
      color: theme.palette.content.action,
    },
  },
}));

export default useStudioOverviewStyles;
