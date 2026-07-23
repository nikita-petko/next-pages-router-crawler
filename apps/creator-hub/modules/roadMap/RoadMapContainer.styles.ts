import { makeStyles } from '@rbx/ui';

const useRoadMapContainerStyles = makeStyles()((theme) => {
  return {
    container: {
      backgroundColor: theme.palette.surface[0],
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 0,
      width: '100%',
      minHeight: '100vh',
    },
    accordionContainer: {
      margin: '24px 0',
    },
    banner: {
      position: 'relative',
      textAlign: 'center',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 48,
      maxHeight: '80vh',
      minHeight: 615,
      overflow: 'hidden',
    },
    iconButton: {
      marginTop: 30,
      '& > :first-child': {
        marginRight: 10,
      },
    },
    callToAction: {
      marginTop: 24,
      flexGrow: 0,
    },
    bannerImages: {
      display: 'flex',
      justifyContent: 'space-between',
      position: 'absolute',
      width: theme.breakpoints.values.XXLarge,
      [theme.breakpoints.up('XXLarge')]: {
        width: '100%',
      },
    },
    accordions: {
      margin: '0 12px',
      [theme.breakpoints.up('Medium')]: {
        margin: '0 24px',
      },
    },
    secondaryText: {
      lineHeight: '140%',
      [theme.breakpoints.up('Medium')]: {
        fontSize: 24,
      },
    },
    lastUpdated: {
      marginTop: 18,
    },
    bannerContent: {
      display: 'flex',
      flexDirection: 'column',
      position: 'absolute',
      maxWidth: 920,
      padding: '0 24px',
      alignItems: 'center',
      zIndex: 1,
    },
    disclaimer: {
      maxWidth: 700,
      textAlign: 'center',
      padding: '0 24px 15px 24px',
    },
  };
});

export default useRoadMapContainerStyles;
