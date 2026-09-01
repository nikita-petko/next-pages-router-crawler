import { makeStyles } from '@rbx/ui';

const useUnlockServicePageContainerStyles = makeStyles()(() => {
  return {
    formContainer: {
      marginTop: 24,
      marginBottom: -24,
    },
    linkButtons: {
      marginTop: 24,
      marginRight: 8,
    },
    openIcon: {
      marginLeft: 4,
    },
  };
});

export default useUnlockServicePageContainerStyles;
