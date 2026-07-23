import React, { useCallback } from 'react';
import { useSnackbar } from '@rbx/ui';
import { toastDurationTime } from '@modules/miscellaneous/common';

const useBottomMessage = () => {
  const { enqueue, close: closeSnackbar } = useSnackbar();
  const showBottomMsg = useCallback(
    (msg: string) => {
      enqueue({
        message: <span data-testid='success-message'>{msg}</span>,
        anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
        autoHideDuration: toastDurationTime,
        autoHide: true,
        onClose: closeSnackbar,
      });
    },
    [enqueue, closeSnackbar],
  );
  return { showBottomMsg };
};

export default useBottomMessage;
