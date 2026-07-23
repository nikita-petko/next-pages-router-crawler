import { makeStyles } from '@rbx/ui';

const useUnlockToggleRowStyles = makeStyles()(() => {
  return {
    root: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      width: '100%',
    },
    toggleWrapper: {
      flexShrink: 0,
      paddingTop: 2,
    },
    textContainer: {
      display: 'flex',
      flexDirection: 'column',
      flexGrow: 1,
      minWidth: 0,
    },
  };
});

export default useUnlockToggleRowStyles;
