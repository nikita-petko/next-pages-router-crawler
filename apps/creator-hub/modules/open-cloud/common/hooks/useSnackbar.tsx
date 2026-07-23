import type { ReactNode } from 'react';
import { useContext, useCallback } from 'react';
import ToastStateContext from '../providers/ToastContext';

function useSnackbar() {
  const { showToast, closeToast } = useContext(ToastStateContext);

  const showSnackbar = useCallback(
    (
      severity: 'info' | 'warning' | 'error' | 'success',
      title: string,
      message: string | ReactNode,
      canClose?: boolean,
    ) => {
      if (showToast) {
        showToast(
          title,
          true,
          severity,
          message,
          {
            vertical: 'top',
            horizontal: 'center',
          },
          canClose,
        );
      }
    },
    [showToast],
  );

  const closeSnackbar = useCallback(() => {
    closeToast?.();
  }, [closeToast]);

  return {
    showSnackbar,
    closeSnackbar,
  };
}

export default useSnackbar;
