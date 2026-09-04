import { makeStyles } from '@rbx/ui';

const operationSideWidth = 62.5;
const heightToLeftBlankAtBottom = 248;
const scrollbarWidth = 6;

const useGameImagesTranslationManagementContainerStyles = makeStyles()((theme) => ({
  verticalDivider: {
    height: 'auto',
    marginLeft: 0,
  },

  errorTextGrid: {
    width: '100%',
    height: '100vh',
  },

  errorText: {
    marginLeft: theme.spacing(2 / 3),
  },

  operationSide: {
    position: 'relative',
    width: `${operationSideWidth}%`,
    height: `calc(100vh - ${heightToLeftBlankAtBottom}px)`,
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
    paddingLeft: 17,
    paddingRight: 32,
  },
}));

export default useGameImagesTranslationManagementContainerStyles;
