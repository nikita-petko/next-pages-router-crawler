import React, { useCallback, ReactNode } from 'react';
import { makeStyles, useSnackbar } from '@rbx/ui';
import InsightsSnackbar from './InsightsSnackbar';

const useSnackbarStyles = makeStyles()((theme) => ({
  success: {
    color: theme.palette.content.static.dark,
    backgroundColor: theme.palette.components.alert.activeContent,
  },
  failure: {
    color: theme.palette.content.static.light,
    backgroundColor: theme.palette.actionV2.important.fill,
  },
}));

/**
 * Hook to interface with the snackbar on the insights feed.
 */
const useInsightsSnackbar = () => {
  const { enqueue } = useSnackbar();
  const {
    classes: { success, failure },
  } = useSnackbarStyles();

  const showSnackbar = useCallback(
    (message: ReactNode, isSuccess: boolean) => {
      enqueue({
        message: <InsightsSnackbar isSuccess={isSuccess}>{message}</InsightsSnackbar>,
        autoHide: true,
        anchorOrigin: {
          horizontal: 'center',
          vertical: 'top',
        },
        ContentProps: {
          classes: {
            root: isSuccess ? success : failure,
          },
        },
      });
    },
    [enqueue, success, failure],
  );

  return { showSnackbar };
};

export default useInsightsSnackbar;
