import React, { FunctionComponent } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Typography, Button } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';

type PayoutInitiatedDialogProps = {
  open: boolean;
  onClose: () => void;
};

const PayoutInitiatedDialog: FunctionComponent<PayoutInitiatedDialogProps> = ({
  open,
  onClose,
}) => {
  const { translate } = useTranslation();

  return (
    <Dialog
      data-testid='payout-initiated-dialog'
      open={open}
      onClose={onClose}
      maxWidth='Small'
      fullWidth>
      <DialogTitle>{translate('Title.PayoutInitiated')}</DialogTitle>
      <DialogContent>
        <Typography>{translate('Message.PayoutInitiated')}</Typography>
      </DialogContent>
      <DialogActions>
        <Button variant='contained' color='primaryBrand' onClick={onClose}>
          {translate('Action.Close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PayoutInitiatedDialog;
