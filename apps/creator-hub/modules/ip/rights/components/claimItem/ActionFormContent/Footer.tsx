import React from 'react';
import { Button, Grid, Typography, useSnackbar } from '@rbx/ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useFormContext, UseFormHandleSubmit } from 'react-hook-form';
import { useRouter } from 'next/router';
import useSubmitDisputeForm from '../../../hooks/useSubmitDisputeForm';
import { DisputeFormFields } from './DisputeForm';
import useModalStyles from '../useModalStyles';

export interface FooterProps {
  handleClose: () => void;
  handleSubmit: UseFormHandleSubmit<DisputeFormFields>;
  activeStep: number;
  setActiveStep: (step: number) => void;
  isNextEnabled: boolean;
  accountId: string;
  claimId: string;
  claimItemId: string;
}

// Footer displays the footer buttons for the dispute form - cancel, back, next, and submit
function Footer({
  handleClose,
  handleSubmit,
  activeStep,
  setActiveStep,
  isNextEnabled,
  accountId,
  claimId,
  claimItemId,
}: FooterProps) {
  const { translate } = useTranslation();
  const {
    classes: { buttonContainer, buttonContainerEnd, buttonSuccess },
  } = useModalStyles();
  const { watch } = useFormContext();
  const router = useRouter();
  const { enqueue, close: closeSnackbar } = useSnackbar();
  const showSnackbar = (success: boolean) => {
    enqueue(
      {
        message: (
          <Typography>
            {success ? translate('Message.DisputeSubmitted') : translate('Message.DisputeFailed')}
          </Typography>
        ),
        anchorOrigin: { vertical: 'top', horizontal: 'center' },
        autoHideDuration: 3000,
        autoHide: true,
        onClose: closeSnackbar,
      },
      (reason) => reason === 'timeout',
    );
  };

  const onSuccess = () => {
    handleClose();
    showSnackbar(true);
    router.reload();
  };

  const onError = () => {
    showSnackbar(false);
  };

  const submitForm = useSubmitDisputeForm(accountId, claimId, claimItemId, onSuccess, onError);

  const disputeSubmitEnabled =
    watch('reason') &&
    watch('description') &&
    watch('documents').length > 0 &&
    watch('reviewCheck') &&
    watch('fraudCheck') &&
    watch('signature');

  return (
    <Grid container item XSmall={12}>
      <Grid container item XSmall={6} className={buttonContainer}>
        <Button onClick={handleClose} variant='text' color='inherit'>
          {translate('Label.Cancel')}
        </Button>
      </Grid>
      <Grid container item XSmall={6} columnGap={2} className={buttonContainerEnd}>
        {activeStep !== 0 && (
          <Button
            onClick={() => {
              setActiveStep(activeStep - 1);
              closeSnackbar();
            }}
            variant='contained'
            color='inherit'
            disabled={activeStep === 0}>
            {translate('Label.Back')}
          </Button>
        )}
        {activeStep !== 2 ? (
          <Button
            onClick={() => {
              setActiveStep(activeStep + 1);
            }}
            variant='contained'
            className={buttonSuccess}
            disabled={!isNextEnabled}>
            {translate('Label.Next')}
          </Button>
        ) : (
          <Button
            onClick={handleSubmit((data) => submitForm.mutate(data))}
            variant='contained'
            className={buttonSuccess}
            disabled={!disputeSubmitEnabled || submitForm.isPending}>
            {translate('Label.DisputeClaim')}
          </Button>
        )}
      </Grid>
    </Grid>
  );
}

export default withTranslation(Footer, [TranslationNamespace.RightsPortal]);
