import { makeStyles } from '@rbx/ui';

const useLandingDividerStyles = makeStyles()((theme) => ({
  root: {
    position: 'relative',
  },

  divider: {
    height: 200,
    margin: '60px 0',
    zIndex: theme.zIndex.mobileStepper,
    background:
      'linear-gradient(0deg, rgba(86, 86, 86, 0) 0%, #565656 17.19%, #565656 82.81%, rgba(86, 86, 86, 0) 100%)',
    [theme.breakpoints.down('XLarge')]: { height: 120, margin: '40px 0' },
    [theme.breakpoints.down('Medium')]: { height: 100, margin: '20px 0' },
  },

  logo: {
    width: '100%',
    verticalAlign: 'middle',
    marginBottom: 28,
    zIndex: theme.zIndex.mobileStepper,
    [theme.breakpoints.down('Medium')]: { marginBottom: 16 },
  },

  highlight: {
    width: '60vw',
    position: 'absolute',
    height: 280,
    marginTop: 260,
    background: 'radial-gradient(40% 40% at center, #646A93 0%, rgba(13, 9, 22, 0) 100%)',
    [theme.breakpoints.up('XXLarge')]: { marginTop: 364, width: '50vw' },
    [theme.breakpoints.down('XLarge')]: { marginTop: 140, width: '100%' },
    [theme.breakpoints.down('Medium')]: { marginTop: 100 },
  },
}));

export default useLandingDividerStyles;
