import React, { useCallback } from 'react';
import { toastDurationTime } from '@modules/miscellaneous/common';
import { Alert, useSnackbar } from '@rbx/ui';

export default () => {
  const { enqueue } = useSnackbar();

  const showSnackbarMessage = useCallback(
    (severity: 'success' | 'error', msg: string) => {
      if (severity === 'success') {
        enqueue({
          message: msg,
          anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
          autoHideDuration: toastDurationTime,
          autoHide: true,
        });
      } else {
        enqueue({
          children: (
            <Alert severity={severity} variant='standard'>
              {msg}
            </Alert>
          ),
          anchorOrigin: { vertical: 'top', horizontal: 'center' },
          autoHideDuration: toastDurationTime,
          autoHide: true,
        });
      }
    },
    [enqueue],
  );

  return showSnackbarMessage;
};
