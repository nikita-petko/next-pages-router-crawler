import React from 'react';
import { Button, Dialog, DialogContent } from '@rbx/foundation-ui';
import dialogStyles from '../shared/Layout.module.css';

type CloseJobDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm?: () => void;
};

export const CloseJobDialog: React.FC<CloseJobDialogProps> = ({ open, onClose, onConfirm }) => {
  const handleConfirm = () => {
    onConfirm?.();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
      size='Medium'
      isModal
      hasCloseAffordance={false}>
      <DialogContent>
        <div className='flex flex-col gap-medium padding-large'>
          <div className='text-title-large'>Close job post</div>
          <div className='text-body-medium content-muted'>
            This job will be removed from the job listings on Talent Hub, and creators will no
            longer be able to apply.
          </div>
          <div className={`flex gap-small margin-top-small ${dialogStyles.equalButtons}`}>
            <Button variant='Alert' size='Medium' onClick={handleConfirm}>
              Close job
            </Button>
            <Button variant='Standard' size='Medium' onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CloseJobDialog;
