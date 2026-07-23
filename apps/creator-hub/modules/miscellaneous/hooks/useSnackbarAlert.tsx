import React, { useCallback } from 'react';
import { toastDurationTime } from '@modules/miscellaneous/common';
import { Alert, useSnackbar, TAlertProps } from '@rbx/ui';

const useSnackbarAlert = () => {
  const { enqueue } = useSnackbar();

  const showSnackbarMessage = useCallback(
    (
      severity: TAlertProps['severity'],
      message: string,
      alertVariant: TAlertProps['variant'] = 'standard',
      anchorOrigin: {
        vertical: 'top' | 'bottom';
        horizontal: 'left' | 'center' | 'right';
      } = { vertical: 'top', horizontal: 'center' },
      autoHide: boolean = true,
      autoHideDuration: number = toastDurationTime,
    ) => {
      enqueue({
        children: (
          <Alert severity={severity} variant={alertVariant}>
            {message}
          </Alert>
        ),
        anchorOrigin,
        autoHide,
        autoHideDuration,
      });
    },
    [enqueue],
  );

  return showSnackbarMessage;
};

export default useSnackbarAlert;
