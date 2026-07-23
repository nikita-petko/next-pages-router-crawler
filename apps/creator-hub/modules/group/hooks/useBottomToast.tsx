import React, { useCallback } from 'react';
import { Alert, type TAlertProps, useSnackbar } from '@rbx/ui';
import { toastDurationTime } from '@modules/miscellaneous/common';

interface ShowToastOptions {
  severity?: TAlertProps['severity'];
  className?: string;
}
const useBottomToast = () => {
  const { enqueue, close } = useSnackbar();

  const showBottomToast = useCallback(
    (msg: string, options: ShowToastOptions = {}) => {
      const { severity = 'success', className } = options;
      enqueue({
        children: <Alert severity={severity}>{msg}</Alert>,
        anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
        autoHideDuration: toastDurationTime,
        autoHide: true,
        onClose: close,
        className,
      });
    },
    [enqueue, close],
  );
  return { showBottomToast };
};

export default useBottomToast;
