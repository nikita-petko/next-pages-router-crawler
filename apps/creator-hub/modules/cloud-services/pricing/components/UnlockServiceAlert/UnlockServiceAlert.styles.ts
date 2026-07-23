import { makeStyles } from '@rbx/ui';

const useUnlockServiceAlertStyles = makeStyles()(() => {
  return {
    alertButtonText: {
      marginTop: -4,
      marginBottom: -8,
      textTransform: 'none',
      fontSize: '0.75rem',
      whiteSpace: 'nowrap',
    },
    alertContainer: {
      marginTop: 8,
      width: '100%',
    },
    alertTitleText: {
      marginBottom: 6,
    },
  };
});

export default useUnlockServiceAlertStyles;
