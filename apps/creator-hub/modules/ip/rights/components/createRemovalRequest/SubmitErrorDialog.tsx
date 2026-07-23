import React from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Dialog, DialogTemplate, Typography } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

export interface SubmitDialogProps {
  open: boolean;
  onClose: () => void;
  reset: () => void;
  onSubmit: () => void;
  isLoading: boolean;
}

/**
 * SubmitErrorDialog is a dialog we show if error submission fails and we want to allow retries
 * Notably, case submission is not done with react-hook-form, so the data needs to be passed in directly
 */
const SubmitErrorDialog = ({ open, onClose, onSubmit, reset, isLoading }: SubmitDialogProps) => {
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
      <DialogTemplate
        loading={isLoading}
        cancelText={translate('Action.BackToEdit')}
        color='primaryBrand'
        confirmText={translate('Action.TryAgain')}
        content={<Typography variant='body1'>{translate('Error.SubmitDialog')}</Typography>}
        onCancel={onClose}
        onConfirm={onSubmit}
        title={translate('Error.RemovalRequestFailure')}
        variant='alert'
      />
    </Dialog>
  );
};

export default withTranslation(SubmitErrorDialog, [TranslationNamespace.RightsPortal]);
