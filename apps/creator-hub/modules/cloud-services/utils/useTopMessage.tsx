import React, { useCallback } from 'react';
import { useSnackbar, Alert, makeStyles } from '@rbx/ui';
import { toastDurationTime } from '@modules/miscellaneous/common';

const useTopMessageStyles = makeStyles()(() => ({
  root: {
    padding: 0,
  },

  message: {
    padding: 0,
  },
}));

const useTopMessage = () => {
  const { enqueue, close: closeSnackbar } = useSnackbar();
  const { classes: styles } = useTopMessageStyles();
  const showTopMessage = useCallback(
    (msg: string, isError = false) => {
      enqueue({
        ContentProps: { classes: styles },
        message: (
          <Alert
            data-testid={`${isError ? 'error' : 'success'}-message`}
            variant='filled'
            severity={isError ? 'error' : 'success'}>
            {msg}
          </Alert>
        ),
        anchorOrigin: { vertical: 'top', horizontal: 'center' },
        autoHideDuration: toastDurationTime,
        autoHide: true,
        onClose: closeSnackbar,
      });
    },
    [enqueue, closeSnackbar, styles],
  );
  const showSuccessMessage = useCallback((msg: string) => showTopMessage(msg), [showTopMessage]);
  const showFailureMessage = useCallback(
    (msg: string) => showTopMessage(msg, true),
    [showTopMessage],
  );
  return {
    showSuccessMessage,
    showFailureMessage,
  };
};

export default useTopMessage;
