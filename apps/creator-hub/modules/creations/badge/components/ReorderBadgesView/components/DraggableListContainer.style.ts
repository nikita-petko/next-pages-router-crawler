import { makeStyles } from '@rbx/ui';

const useDraggableListContainerStyles = makeStyles()((theme) => ({
  infiniteScroll: {
    paddingBottom: 30,
    maxHeight: `45vh`,
    overflowY: 'scroll',
    overflowX: 'hidden',
    scrollbarColor: `${theme.palette.states.focusVisible} transparent`,
    '&::-webkit-scrollbar-thumb': {
      background: theme.palette.states.focusVisible,
      borderRadius: '10rem',
    },
    '&::-webkit-scrollbar-track': {
      background: 'transparent',
    },
  },
  infiniteScrollContainer: {
    paddingBottom: 30,
    minHeight: 24,
  },
}));

export default useDraggableListContainerStyles;
