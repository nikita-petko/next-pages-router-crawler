import { makeStyles } from '@rbx/ui';

const useScrollStyles = makeStyles()(() => ({
  scroll: {
    overflowY: 'scroll',
    overflowX: 'hidden',
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

export default useScrollStyles;
