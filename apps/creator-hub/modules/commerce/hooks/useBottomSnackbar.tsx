import React, { useCallback } from 'react';
import { Alert, makeStyles, Typography, useSnackbar } from '@rbx/ui';

const useAlertStyles = makeStyles()(() => ({
  root: {
    minWidth: 'initial',
    padding: 0,
  },
  message: {
    width: '100%',
    padding: 0,
    textAlign: 'center',
  },
}));

const useSnackbarStyles = makeStyles()(() => ({
  root: {
    minWidth: 'initial',
    padding: '6px 16px',
    height: 46,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    width: '100%',
    padding: 0,
    textAlign: 'center',
  },
}));

const useBottomSnackbar = () => {
  const { enqueue } = useSnackbar();
  const alertClasses = useAlertStyles();
  const snackbarClasses = useSnackbarStyles();

  const enqueueSnackbar = useCallback(
    (message: string, alertProps?: React.ComponentProps<typeof Alert>) => {
      enqueue(
        !alertProps
          ? {
              ContentProps: snackbarClasses,
              message: <Typography variant='smallLabel1'>{message}</Typography>,
              anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
              autoHide: true,
            }
          : {
              ContentProps: alertClasses,
              message: (
                <Alert variant='standard' {...alertProps}>
                  {message}
                </Alert>
              ),
              anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
              autoHide: true,
            },
      );
    },
    [snackbarClasses, alertClasses, enqueue],
  );

  return { enqueueSnackbar };
};

export default useBottomSnackbar;
