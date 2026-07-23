import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@rbx/ui';
import React from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

export interface SubmitDialogWithoutRetryProps {
  open: boolean;
  onClose: () => void;
  reset: () => void;
}

/**
 * SubmitErrorWithoutRetryDialog is a dialog we show if error submission fails due to error with the contents
 * so we don't want the user to be able to retry the submission.
 * Notably, case submission is not done with react-hook-form, so the data needs to be passed in directly
 */
const SubmitErrorWithoutRetryDialog = ({ open, onClose, reset }: SubmitDialogWithoutRetryProps) => {
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
        <Typography variant='h2'>{translate('Error.RemovalRequestFailure')}</Typography>
      </DialogTitle>
      <DialogContent>
        <Typography variant='body1' color='secondary'>
          {translate('Error.SubmitDialogWithoutRetry')}
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

export default withTranslation(SubmitErrorWithoutRetryDialog, [TranslationNamespace.RightsPortal]);
