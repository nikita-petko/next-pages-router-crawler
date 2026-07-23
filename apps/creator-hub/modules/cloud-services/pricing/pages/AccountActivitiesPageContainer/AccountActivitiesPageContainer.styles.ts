import { makeStyles } from '@rbx/ui';

const useAccountActivitiesPageContainerStyles = makeStyles()((theme) => {
  return {
    overlay: {
      width: '100%',
      height: '100%',
      position: 'absolute',
      top: 0,
      left: 0,
      zIndex: 9999,
    },
    disabledOverlay: {
      background: theme.palette.surface[100],
      opacity: 0.75,
    },
    loader: {
      position: 'fixed',
      left: '50%',
      top: '50%',
      opacity: 1,
    },
    loaderDescription: {
      marginTop: 16,
    },
  };
});

export default useAccountActivitiesPageContainerStyles;
