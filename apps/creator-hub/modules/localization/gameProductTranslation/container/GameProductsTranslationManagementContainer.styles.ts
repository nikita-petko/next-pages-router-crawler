import { makeStyles } from '@rbx/ui';

const operationSideWidth = 62.5;
const entrySideWidth = 37.5;
const heightToLeftBlankAtBottom = 248;
const scrollbarWidth = 6;

const useGameProductsTranslationManagementContainerStyles = makeStyles()((theme) => ({
  verticalDivider: {
    height: 'auto',
    marginLeft: 0,
  },

  translationSide: {
    width: `${operationSideWidth}%`,
    height: `calc(100vh - ${heightToLeftBlankAtBottom}px)`,
    paddingLeft: 17,
    paddingRight: 32,
    overflowY: 'scroll',
    scrollbarColor: 'transparent transparent',
    scrollbarWidth: 'thin',
    '&:hover': {
      scrollbarColor: 'grey transparent',
    },
    '&::-webkit-scrollbar': {
      width: `${scrollbarWidth}px`,
    },
    '&::-webkit-scrollbar-track': {
      backgroundColor: 'transparent',
    },
    '&:hover::-webkit-scrollbar-thumb': {
      backgroundColor: 'grey',
      borderRadius: '10rem',
    },
  },

  entrySide: {
    width: `${entrySideWidth}%`,
  },

  list: {
    paddingTop: 0,
    overflowY: 'scroll',
    width: '100%',
    height: `calc(100vh - ${heightToLeftBlankAtBottom}px)`,
    scrollbarColor: 'transparent transparent',
    scrollbarWidth: 'thin',
    '&:hover': {
      scrollbarColor: 'grey transparent',
    },
    '&::-webkit-scrollbar': {
      width: `${scrollbarWidth}px`,
    },
    '&::-webkit-scrollbar-track': {
      backgroundColor: 'transparent',
    },
    '&:hover::-webkit-scrollbar-thumb': {
      backgroundColor: 'grey',
      borderRadius: `${theme.shape.borderRadius}px`,
    },
  },

  selectBar: {
    width: '100%',
    paddingLeft: theme.spacing(4),
  },

  topGrid: {
    top: 0,
    zIndex: 1,
    position: 'sticky',
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(3 / 2),
    background: theme.palette.background.default,
  },

  errorTextGrid: {
    width: '100%',
    height: '100vh',
  },

  errorText: {
    marginLeft: theme.spacing(2 / 3),
  },
}));

export default useGameProductsTranslationManagementContainerStyles;
