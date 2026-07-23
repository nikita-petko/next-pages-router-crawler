import { makeStyles } from '@rbx/ui';

export const topNavigationHeights = {
  large: 60,
  compact: 60,
};

export const leftNavigationWidths = {
  large: 340,
  compact: 0,
};

export const contentPadding = {
  large: 48,
  medium: 24,
  small: 0,
};

const useLayoutStyles = makeStyles()((theme) => ({
  header: {
    width: '100%',
    height: `${topNavigationHeights.large}px`,
    position: 'fixed',
    top: '0px',
    zIndex: theme.zIndex.appBar,
    [theme.breakpoints.down('Medium')]: {
      height: `${topNavigationHeights.compact}px`,
    },
  },

  content: {
    marginLeft: `${leftNavigationWidths.large}px`,
    width: `calc(100% - ${leftNavigationWidths.large}px)`,
    padding: `${contentPadding.large}px ${contentPadding.large}px`,
    backgroundColor: theme.palette.navigation.default,
    [theme.breakpoints.down('XLarge')]: {
      padding: `${contentPadding.large}px ${contentPadding.medium}px`,
    },
    [theme.breakpoints.down('Large')]: {
      padding: `${contentPadding.large}px ${contentPadding.medium}px`,
    },
    [theme.breakpoints.down('Medium')]: {
      marginLeft: `${leftNavigationWidths.compact}px`,
      width: `calc(100% - ${leftNavigationWidths.compact}px)`,
      padding: `${contentPadding.large}px ${contentPadding.small}px`,
    },
  },

  fullWidthContent: {
    width: '100%',
    backgroundColor: theme.palette.navigation.default,
    [theme.breakpoints.down('XLarge')]: {
      padding: 32,
    },
    [theme.breakpoints.down('Medium')]: {
      padding: 0,
    },
  },

  contentV2: {
    width: '100%',
    height: '100%',
    maxWidth: '1920px',
    padding: `${contentPadding.large}px ${contentPadding.large}px`,
    backgroundColor: theme.palette.navigation.default,
    [theme.breakpoints.down('XLarge')]: {
      padding: `${contentPadding.large}px ${contentPadding.medium}px`,
    },
    [theme.breakpoints.down('Large')]: {
      padding: `${contentPadding.large}px ${contentPadding.medium}px`,
    },
    [theme.breakpoints.down('Medium')]: {
      padding: `${contentPadding.large}px ${contentPadding.small}px`,
    },
  },

  fullWidthContentV2: {
    width: '100%',
    height: '100%',
    maxWidth: '1920px',
    backgroundColor: theme.palette.navigation.default,
    [theme.breakpoints.down('XXLarge')]: {
      padding: 32,
    },
    [theme.breakpoints.down('Medium')]: {
      padding: 12,
    },
  },

  minHeight: {
    minHeight: 0,
  },

  fullHeight: {
    height: '100%',
  },

  centerContent: {
    display: 'flex',
    justifyContent: 'center',
  },

  positionRelative: {
    position: 'relative',
  },

  scrollableY: {
    height: '100%',
    overflowY: 'auto',
    overflowX: 'hidden',
    // better looking thin scrollbar
    scrollbarColor: 'grey transparent',
    scrollbarWidth: 'thin',
    '&::-webkit-scrollbar': {
      width: 6,
    },
    '&::-webkit-scrollbar-thumb': {
      background: 'grey',
      borderRadius: '10rem',
    },
    '&::-webkit-scrollbar-track': {
      background: 'transparent',
    },
  },
}));

export default useLayoutStyles;
