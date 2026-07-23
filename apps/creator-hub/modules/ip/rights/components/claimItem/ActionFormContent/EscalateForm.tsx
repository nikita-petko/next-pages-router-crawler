import React, { useState, FunctionComponent } from 'react';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useTranslation, withTranslation } from '@rbx/intl';
import {
  Typography,
  Dialog,
  DialogTitle,
  Grid,
  Step,
  StepLabel,
  Stepper,
  Button,
  useSnackbar,
} from '@rbx/ui';
import { FormMode } from '@modules/miscellaneous/common';
import { useForm, FormProvider } from 'react-hook-form';
import LegalAgreements from '@modules/legal-agreements/components/LegalAgreements';
import { useRouter } from 'next/router';
import { ClaimItem } from '@modules/clients/rights';
import { Doc } from '@modules/miscellaneous/common/components/uploaders';
import useModalStyles from '../useModalStyles';
import { DocumentUploader } from '../../documents/DocumentForm';
import useEscalateClaimItemForm from '../../../hooks/useEscalateClaimItemForm';

import ControlledDescription, {
  DEFAULT_MAX_CHARACTER_COUNT as MAX_CHARACTER_COUNT,
} from '../../common/ControlledDescription';

interface EscalateFormProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  accountId: string;
  claimId: string;
  claimItemId: string;
  claimItem: ClaimItem;
}

export interface EscalateFormFields {
  description: string;
  documents: Doc[];
  documentIds: string[];
  firstCheck: boolean;
  secondCheck: boolean;
  signature: string;
}

// EscalateForm displays a modal for the rights holder to escalate a dispute
const EscalateForm: FunctionComponent<EscalateFormProps> = ({
  open,
  setOpen,
  accountId,
  claimId,
  claimItemId,
  claimItem,
}) => {
  const { translate } = useTranslation();
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const formMethods = useForm<EscalateFormFields>({
    mode: FormMode.OnChange,
    reValidateMode: FormMode.OnChange,
    defaultValues: {
      description: claimItem.originalDescription || '',
      documents: claimItem.originalDocuments || [],
    },
  });
  const { watch, handleSubmit, reset, control, formState } = formMethods;
  const { errors } = formState;

  const descriptionValue = watch('description');
  const isNextEnabled =
    (activeStep === 0 && !!descriptionValue && descriptionValue.length <= MAX_CHARACTER_COUNT) ||
    (activeStep === 1 && watch('documents').length > 0);

  const {
    classes: { container, hiddenContainer, buttonSuccess, buttonContainer, buttonContainerEnd },
  } = useModalStyles();

  const handleClose = () => {
    setOpen(false);
    setActiveStep(0);
    reset();
  };

  const { enqueue, close: closeSnackbar } = useSnackbar();
  const showSnackbar = (success: boolean) => {
    enqueue(
      {
        message: (
          <Typography>
            {success
              ? translate('Message.EscalationSubmitted')
              : translate('Message.EscalationFailed')}
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

  const submitForm = useEscalateClaimItemForm(accountId, claimId, claimItemId, onSuccess, onError);

  const escalationSubmitEnabled =
    descriptionValue &&
    descriptionValue.length <= MAX_CHARACTER_COUNT &&
    watch('documents').length > 0 &&
    watch('firstCheck') &&
    watch('secondCheck') &&
    watch('signature');

  return (
    <FormProvider {...formMethods}>
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth='Medium'>
        <DialogTitle>{translate('Label.EscalateToRoblox')}</DialogTitle>
        <Grid container spacing={2} rowGap={2} className={container}>
          <Grid item XSmall={12}>
            <Typography> {translate('Description.Escalation')}</Typography>
          </Grid>
          <Grid item XSmall={12}>
            <Stepper activeStep={activeStep} orientation='horizontal'>
              <Step>
                <StepLabel>
                  <Typography>{translate('Label.Description')}</Typography>
                </StepLabel>
              </Step>
              <Step>
                <StepLabel>
                  <Typography>{translate('Label.SupportingInformation')}</Typography>
                </StepLabel>
              </Step>
              <Step>
                <StepLabel>
                  <Typography>{translate('Label.Agreements')}</Typography>
                </StepLabel>
              </Step>
            </Stepper>
          </Grid>
          <Grid
            item
            container
            XSmall={12}
            direction='column'
            className={activeStep === 0 ? '' : hiddenContainer}>
            <ControlledDescription
              description={descriptionValue}
              control={control}
              error={errors.description}
              placeholderKey='Description.EscalationDescribe'
              maxCharacterCount={MAX_CHARACTER_COUNT}
              required
            />
          </Grid>
          <Grid
            item
            container
            XSmall={12}
            direction='column'
            rowSpacing={2}
            className={activeStep === 1 ? '' : hiddenContainer}>
            <Grid container item XSmall>
              <Typography>{translate('Description.SupportingInformation')}</Typography>
            </Grid>
            <Grid container item XSmall>
              <DocumentUploader
                maxCount={3}
                placeholder={translate('Label.DragHereToUpload')}
                acceptedMIMETypes={['application/pdf', 'image/jpeg', 'image/png']}
                translate={translate}
                required
              />
            </Grid>
          </Grid>
          <Grid
            item
            container
            XSmall={12}
            rowSpacing={3}
            direction='column'
            sx={{ marginTop: '-50px' }}
            className={activeStep === 2 ? '' : hiddenContainer}>
            <LegalAgreements
              isSignatureRequired
              signatureWidth='100%'
              legalStatements={[
                {
                  text: translate('Description.FirstLegalStatement'),
                  id: 'firstCheck',
                },
                {
                  text: translate('Description.SecondLegalStatement'),
                  id: 'secondCheck',
                },
              ]}
            />
          </Grid>
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
                  disabled={!escalationSubmitEnabled || submitForm.isPending}>
                  {translate('Label.EscalateClaim')}
                </Button>
              )}
            </Grid>
          </Grid>
        </Grid>
      </Dialog>
    </FormProvider>
  );
};
export default withTranslation(EscalateForm, [TranslationNamespace.RightsPortal]);
