import React, { useCallback } from 'react';
import type { TAlertProps } from '@rbx/ui';
import { Alert, useSnackbar } from '@rbx/ui';
import { toastDurationTime } from '@modules/miscellaneous/common';

const useSnackbarAdvancedResponse = () => {
  const { enqueue } = useSnackbar();

  const showSnackbarMessage = useCallback(
    (severity: TAlertProps['severity'], msg: string) => {
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
    },
    [enqueue],
  );

  return showSnackbarMessage;
};

export default useSnackbarAdvancedResponse;
