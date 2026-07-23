import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@rbx/ui';
import React from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

export interface ConflictClaimSubmittedDialogProps {
  onClose: () => void;
  reset: () => void;
}

/**
 * ConflictClaimSubmittedDialog is a dialog we show if claim submitted successfully but there are conflicts with the contents
 * so we don't need user to edit or retry the submission, but we want to inform them that some contents were not submitted.
 */
const ConflictClaimSubmittedDialog = ({ onClose, reset }: ConflictClaimSubmittedDialogProps) => {
  const { ready, translate } = useTranslation();

  if (!ready) {
    return null;
  }

  return (
    <Dialog
      onClose={onClose}
      open
      TransitionProps={{
        onExited: reset,
      }}>
      <DialogTitle>
        <Typography variant='h2'>{translate('Error.ConflictClaimSubmitted')}</Typography>
      </DialogTitle>
      <DialogContent>
        <Typography variant='body1' color='secondary'>
          {translate('Error.ConflictClaimSubmittedDialog')}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant='outlined' color='secondary'>
          {translate('Action.Confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default withTranslation(ConflictClaimSubmittedDialog, [TranslationNamespace.RightsPortal]);
