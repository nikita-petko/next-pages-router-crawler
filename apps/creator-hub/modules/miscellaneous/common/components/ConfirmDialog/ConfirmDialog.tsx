import React, { FunctionComponent, ReactNode } from 'react';
import { Dialog, DialogTemplate, TTheme } from '@rbx/ui';

type TBreakpoints = keyof TTheme['breakpoints']['values'];

export interface ConfirmDialogProp {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  content: ReactNode;
  confirmText: string;
  cancelText: string;
  maxWidth?: TBreakpoints;
  onClose?: () => void;
  isLoading?: boolean;
}

const ConfirmDialog: FunctionComponent<React.PropsWithChildren<ConfirmDialogProp>> = ({
  open,
  onConfirm,
  onCancel,
  title,
  content,
  confirmText,
  cancelText,
  maxWidth = 'Medium',
  onClose,
  isLoading,
}) => {
  return (
    <Dialog maxWidth={maxWidth} open={open} onClose={onClose ?? onCancel}>
      <DialogTemplate
        title={title}
        content={content}
        cancelText={cancelText}
        confirmText={confirmText}
        onCancel={onCancel}
        onConfirm={onConfirm}
        loading={isLoading}
      />
    </Dialog>
  );
};

export default ConfirmDialog;
