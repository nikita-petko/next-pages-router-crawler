import type { ReactNode } from 'react';
import { Fragment, useCallback, useState, useMemo } from 'react';
import { Snackbar, Alert, AlertTitle } from '@rbx/ui';
import ToastStateContext from './ToastContext';

type ToastInfo = {
  title: string;
  show: boolean;
  description: string | ReactNode;
  position: { horizontal: 'left' | 'center' | 'right'; vertical: 'top' | 'bottom' };
  severity: 'info' | 'warning' | 'error' | 'success';
  canClose: boolean;
};

const toastInfoInitial: ToastInfo = {
  title: '',
  show: false,
  severity: 'info',
  description: '',
  position: { horizontal: 'center', vertical: 'top' },
  canClose: false,
};

const clickAwayEvent = 'clickaway';

const ToastProvider = ({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) => {
  const [toastState, setToastState] = useState<ToastInfo>(toastInfoInitial);
  const showToast = useCallback(
    (
      title: string,
      _show: boolean,
      severity: 'info' | 'warning' | 'error' | 'success',
      description: string | ReactNode,
      position: { horizontal: 'left' | 'center' | 'right'; vertical: 'top' | 'bottom' },
      canClose?: boolean,
    ) => {
      setToastState({
        show: true,
        title,
        description,
        position,
        severity,
        canClose: canClose ?? false,
      });
    },
    [],
  );

  const hideToast = (event: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === clickAwayEvent) {
      return;
    }
    setToastState({
      ...toastState,
      show: false,
    });
  };

  const closeToast = useCallback(() => {
    setToastState((prevToastState) => {
      return {
        ...prevToastState,
        show: false,
      };
    });
  }, []);

  return (
    <ToastStateContext.Provider
      value={useMemo(() => ({ showToast, closeToast }), [showToast, closeToast])}>
      <>
        {children}
        <Snackbar
          anchorOrigin={{
            vertical: toastState.position.vertical,
            horizontal: toastState.position.horizontal,
          }}
          open={toastState.show}
          className={className}
          autoHide={!toastState.canClose}
          onClose={hideToast}>
          <Alert
            severity={toastState.severity}
            onClose={toastState.canClose ? closeToast : undefined}>
            <AlertTitle>{toastState.title}</AlertTitle>
            {toastState.description}
          </Alert>
        </Snackbar>
      </>
    </ToastStateContext.Provider>
  );
};

export default ToastProvider;
