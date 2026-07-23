import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@rbx/ui';
import React from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

export interface ConflictClaimFailedDialogProps {
  open: boolean;
  onClose: () => void;
  reset: () => void;
}

/**
 * ConflictClaimFailedDialog is a dialog we show if error submission fails due to all the contents being in conflict
 * so we don't want the user to be able to retry the submission, but we want to allow them to go back to edit the contents.
 */
const ConflictClaimFailedDialog = ({ open, onClose, reset }: ConflictClaimFailedDialogProps) => {
  const { ready, translate } = useTranslation();

  if (!ready) {
    return null;
  }

  return (
    <Dialog
      onClose={onClose}
      open={open}
      TransitionProps={{
        onExited: reset,
      }}>
      <DialogTitle>
        <Typography variant='h2'>{translate('Error.ConflictClaimFailed')}</Typography>
      </DialogTitle>
      <DialogContent>
        <Typography variant='body1' color='secondary'>
          {translate('Error.ConflictClaimFailedDialog')}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant='outlined' color='secondary'>
          {translate('Action.BackToEdit')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default withTranslation(ConflictClaimFailedDialog, [TranslationNamespace.RightsPortal]);
