import { makeStyles } from '@rbx/ui';

const useStudioStyles = makeStyles()((theme) => ({
  root: {
    width: '100%',
    position: 'relative',
    padding: '0 10px',
    [theme.breakpoints.down('Medium')]: {
      marginTop: -15,
    },
  },

  titleContainer: {
    position: 'relative',
  },

  title: {
    marginTop: 100,
    [theme.breakpoints.down('Large')]: {
      marginTop: 0,
    },
    fontWeight: 450,
    lineHeight: '110%',
    width: '85vw',
    fontSize: 55,
    [theme.breakpoints.up('Medium')]: {
      width: 'calc(5vw + 500px)',
      fontSize: 60,
    },
    [theme.breakpoints.up('XLarge')]: {
      marginTop: 160,
      width: 700,
      fontSize: 78,
      lineHeight: '105%',
    },
    [theme.breakpoints.up('XXLarge')]: {
      width: 800,
      fontSize: 92,
      lineHeight: '105%',
      padding: 5,
    },
  },

  backgroundImage: {
    maxWidth: 1250,
    position: 'absolute',
    marginTop: -32,
    width: '100vw',
    height: '100vh',
    objectFit: 'cover',
    [theme.breakpoints.up('Large')]: {
      height: 'auto',
      objectFit: 'fill',
    },
    [theme.breakpoints.up('XLarge')]: {
      marginTop: 0,
      width: '100%',
      maxWidth: 1480,
    },
    [theme.breakpoints.up('XXLarge')]: {
      maxWidth: 1680,
    },
  },

  characters: {
    marginTop: 30,
    '& img': {
      objectFit: 'contain',
      width: 350,
      height: 200,
      [theme.breakpoints.up('Large')]: { width: 450, height: 260 },
      [theme.breakpoints.up('XLarge')]: {
        width: 600,
        height: 345,
      },
      [theme.breakpoints.up('XXLarge')]: {
        width: 680,
        height: 395,
      },
      filter: 'drop-shadow(0px 0px 120px #1581FF)',
    },
  },

  buttonLarge: {
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 20,
  },

  content: {
    marginTop: 20,
    position: 'relative',
  },

  bodyContainer: {
    padding: '16px 40px',
    [theme.breakpoints.up('XLarge')]: {
      marginBottom: 30,
    },
    '& span': {
      [theme.breakpoints.up('XLarge')]: {
        fontSize: '18px',
      },
      [theme.breakpoints.up('XXLarge')]: {
        fontSize: '22px',
        lineHeight: '160%',
      },
    },
  },

  buttonsContainer: {
    width: '100%',
    maxWidth: 350,
    '& button': {
      marginBottom: 16,
    },
  },

  link: {
    color: theme.palette.content.standard,
    textDecoration: 'none',
  },
}));

export default useStudioStyles;
