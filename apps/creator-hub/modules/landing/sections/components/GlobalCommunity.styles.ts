import { makeStyles } from '@rbx/ui';

const useGlobalCommunityStyles = makeStyles()((theme) => ({
  root: {
    width: '100%',
    position: 'relative',
    padding: '0 10px',
  },

  globalNetworkImg: {
    objectFit: 'fill',
    position: 'absolute',
    top: -150,
    left: '50%',
    width: '100%',
    maxWidth: 1250,
    transform: 'translate(-50%)',
  },

  informationContainer: {
    position: 'relative',
    maxWidth: 1250,
    margin: 'auto',
    [theme.breakpoints.down('XLarge')]: {
      flexDirection: 'row',
    },

    [theme.breakpoints.up('XLarge')]: {
      maxWidth: '60%',
    },
  },

  description: {
    [theme.breakpoints.up('XXLarge')]: {
      fontSize: 22,
    },
  },

  avatarContainer: {
    overflow: 'visible',
    marginTop: 40,
    [theme.breakpoints.down('XLarge')]: {
      flexDirection: 'column-reverse',
      flexWrap: 'wrap',
    },
  },

  avatarsImg: {
    position: 'relative',
    width: '60vw',
    [theme.breakpoints.down('XLarge')]: {
      margin: '20px auto 0 auto',
    },
    [theme.breakpoints.down('Large')]: {
      width: '100%',
    },
    '& img': {
      width: '100%',
    },
  },

  publishDescription: {
    [theme.breakpoints.up('XLarge')]: {
      maxWidth: '65%',
    },
  },

  tooltip: {
    marginTop: 20,
    padding: 20,
    overflow: 'visible',
    '&::after': {
      content: '" "',
      position: 'absolute',
      top: '-20px',
      left: '25%',
      transform: 'translate(-50%,-50%)',
      borderWidth: '20px',
      borderStyle: 'solid',
      borderColor: `transparent transparent ${theme.palette.components.media.fill} transparent`,
    },
  },
}));

export default useGlobalCommunityStyles;
