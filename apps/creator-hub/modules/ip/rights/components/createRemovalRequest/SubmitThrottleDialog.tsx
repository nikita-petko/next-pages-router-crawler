import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@rbx/ui';
import React from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

export interface SubmitThrottleProps {
  open: boolean;
  onClose: () => void;
  reset: () => void;
}

/**
 * SubmitThrottleDialog is a dialog we show if error submission fails due to rate limit (http 429)
 * We don't want the user to be able to retry the submission.
 */
const SubmitThrottleDialog = ({ open, onClose, reset }: SubmitThrottleProps) => {
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
          {translate('Error.SubmitThrottledMessage')}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant='outlined' color='secondary'>
          {translate('Action.Close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default withTranslation(SubmitThrottleDialog, [TranslationNamespace.RightsPortal]);
