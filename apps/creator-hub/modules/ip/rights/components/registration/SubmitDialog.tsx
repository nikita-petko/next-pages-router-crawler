import type { FunctionComponent } from 'react';
import React from 'react';
import type { UseFormHandleSubmit } from 'react-hook-form';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Dialog, DialogTemplate, Typography } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useSubmitForm from '../../hooks/useSubmitForm';
import type RightsAccountFormType from '../../types/RightsAccountFormType';

export interface SubmitDialogProps {
  open: boolean;
  onClose: () => void;
  handleSubmit: UseFormHandleSubmit<RightsAccountFormType>;
  onSuccess: () => void;
}

const SubmitDialog: FunctionComponent<React.PropsWithChildren<SubmitDialogProps>> = ({
  open,
  onClose,
  handleSubmit,
  onSuccess,
}) => {
  const { ready, translate } = useTranslation();
  const submitForm = useSubmitForm();

  if (!ready) {
    return null;
  }

  if (submitForm.isSuccess) {
    onSuccess();
    return null;
  }

  let content = <Typography variant='body1'>{translate('Description.SubmitDialog')}</Typography>;
  if (submitForm.isError) {
    content = <Typography variant='body1'>{translate('Error.SubmitDialog')}</Typography>;
  }
  return (
    <Dialog
      onClose={onClose}
      open={open}
      TransitionProps={{
        onExited: submitForm.reset,
      }}>
      <DialogTemplate
        loading={submitForm.isPending}
        cancelText={translate('Action.BackToEdit')}
        color='primaryBrand'
        confirmText={translate('Label.SubmitForReview')}
        content={content}
        onCancel={onClose}
        onConfirm={handleSubmit((data) => {
          submitForm.mutate(data);
          localStorage.setItem('dismissedAccountContainerAlert', JSON.stringify(false));
        })}
        title={translate('Action.SubmitRegistrationForm')}
        variant='alert'
      />
    </Dialog>
  );
};

export default withTranslation(SubmitDialog, [TranslationNamespace.RightsPortal]);
