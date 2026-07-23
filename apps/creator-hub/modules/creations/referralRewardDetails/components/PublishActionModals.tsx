import React from 'react';
import { Dialog, DialogTemplate } from '@rbx/ui';

interface PublishRewardModalProps {
  open: boolean;
  onClose: () => void;
  color: 'primaryBrand' | 'destructive';
  dialogTitle: string;
  dialogDescription: React.ReactNode;
  confirmButtonText: string;
  cancelButtonText: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const DefaultPublishRewardModal = ({
  open,
  onClose,
  color,
  dialogTitle,
  dialogDescription,
  confirmButtonText,
  cancelButtonText,
  onConfirm,
  onCancel,
}: PublishRewardModalProps) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTemplate
        title={dialogTitle}
        color={color}
        content={dialogDescription}
        confirmText={confirmButtonText}
        cancelText={cancelButtonText}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    </Dialog>
  );
};

export default DefaultPublishRewardModal;
