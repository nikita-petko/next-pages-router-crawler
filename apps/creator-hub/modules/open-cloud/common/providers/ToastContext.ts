import type { ReactNode } from 'react';
import { createContext } from 'react';

type ToastStateType = {
  showToast?: (
    title: string,
    show: boolean,
    severity: 'info' | 'warning' | 'error' | 'success',
    description: string | ReactNode,
    position: { horizontal: 'left' | 'center' | 'right'; vertical: 'top' | 'bottom' },
    canClose?: boolean,
  ) => void;
  closeToast?: () => void;
};

const ToastStateContext = createContext<ToastStateType>({});
export default ToastStateContext;
