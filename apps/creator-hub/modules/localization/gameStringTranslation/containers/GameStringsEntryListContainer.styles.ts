import { makeStyles } from '@rbx/ui';

const heightToLeftBlankAtBottom = 248;
const zIndexForElementsOnTop = 1;
const entrySideWidth = 37.5;
const scrollbarWidth = 6;

const useGameStringsEntryListContainerStyles = makeStyles()((theme) => ({
  list: {
    paddingTop: 0,
    overflowY: 'scroll',
    overflowX: 'hidden',
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

  elementsOnTop: {
    top: 0,
    position: 'sticky',
    background: theme.palette.info.contrastText,
    zIndex: zIndexForElementsOnTop,
    paddingLeft: theme.spacing(4),
    paddingTop: theme.spacing(1.25),
    paddingBottom: theme.spacing(4 / 3),
  },

  addEntry: {
    marginTop: theme.spacing(1 / 4),
    marginRight: theme.spacing(1),
  },

  loader: {
    position: 'fixed',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
  },

  wrapper: {
    display: 'inline-block',
    position: 'relative',
    width: '100%',
    transform: 'translateZ(0)',
  },

  overlay: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },

  disabledOverlay: {
    background: theme.palette.background.default,
  },

  entrySide: {
    width: `${entrySideWidth}%`,
  },
}));

export default useGameStringsEntryListContainerStyles;
