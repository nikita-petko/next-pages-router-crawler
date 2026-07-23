import React, { useCallback } from 'react';
import { useSnackbar, Alert } from '@rbx/ui';
import { toastDurationTime } from '@modules/miscellaneous/common';

const useToast = () => {
  const { enqueue, close } = useSnackbar();
  const showToast = useCallback(
    (msg: string) => {
      enqueue({
        children: (
          <Alert variant='standard' severity='error'>
            {msg}
          </Alert>
        ),
        anchorOrigin: { vertical: 'top', horizontal: 'center' },
        autoHideDuration: toastDurationTime,
        autoHide: true,
        onClose: close,
      });
    },
    [enqueue, close],
  );

  return showToast;
};

export default useToast;
