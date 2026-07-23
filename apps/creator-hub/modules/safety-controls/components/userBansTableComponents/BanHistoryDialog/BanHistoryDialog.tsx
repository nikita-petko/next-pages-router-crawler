import React from 'react';
import { Dialog } from '@rbx/ui';
import UseBanHistoryDialogStyles from './BanHistoryDialog.styles';
import BanHistoryDialogContent from './BanHistoryDialogContent';

type BanHistoryDialogProps = {
  universeId: number;
  userId: number;
  open: boolean;
  onClose: () => void;
};

const BanHistoryDialog = ({ universeId, userId, open, onClose }: BanHistoryDialogProps) => {
  const {
    classes: { dialogContainer },
  } = UseBanHistoryDialogStyles();

  return (
    <Dialog
      classes={{ root: dialogContainer }}
      open={open}
      onClose={onClose}
      maxWidth='Large'
      fullWidth>
      <BanHistoryDialogContent universeId={universeId} userId={userId} onClose={onClose} />
    </Dialog>
  );
};

export default BanHistoryDialog;
