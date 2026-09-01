import type { FunctionComponent } from 'react';
import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Typography, Dialog, DialogTitle, Grid, Step, StepLabel, Stepper } from '@rbx/ui';
import { FormMode } from '@modules/miscellaneous/common';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { DEFAULT_MAX_CHARACTER_COUNT as MAX_CHARACTER_COUNT } from '../../common/ControlledDescription';
import useModalStyles from '../useModalStyles';
import DocumentForm from './DocumentForm';
import Footer from './Footer';
import LegalForm from './LegalForm';
import ReasonForm from './ReasonForm';
import type { DisputeFormFields } from './types';

interface DisputeFormProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  claimantName: string;
  accountId: string;
  claimItemId: string;
  claimId: string;
  isClaimedContentDevMarketplace: boolean;
}

// DisputeForm displays a modal for the alleged infringer to dispute a pending claim against them
const DisputeForm: FunctionComponent<DisputeFormProps> = ({
  open,
  setOpen,
  claimantName,
  accountId,
  claimItemId,
  claimId,
  isClaimedContentDevMarketplace,
}) => {
  const { translate } = useTranslation();
  const [activeStep, setActiveStep] = useState(0);
  const formMethods = useForm<DisputeFormFields>({
    mode: FormMode.OnChange,
    reValidateMode: FormMode.OnChange,
    defaultValues: {
      description: '',
      documents: [],
    },
  });
  const { watch, handleSubmit, reset } = formMethods;
  const descriptionValue = watch('description');

  const isNextEnabled =
    (activeStep === 0 && !!watch('reason')) ||
    (activeStep === 1 &&
      !!descriptionValue &&
      descriptionValue.length <= MAX_CHARACTER_COUNT &&
      watch('documents').length > 0);

  const {
    classes: { container, hiddenContainer },
  } = useModalStyles();

  const handleClose = () => {
    setOpen(false);
    setActiveStep(0);
    reset();
  };

  return (
    <FormProvider {...formMethods}>
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth='Medium'>
        <DialogTitle>{translate('Label.DisputeClaim')}</DialogTitle>
        <Grid container spacing={2} rowGap={2} className={container}>
          <Grid item XSmall={12}>
            <Stepper activeStep={activeStep} orientation='horizontal'>
              <Step>
                <StepLabel>
                  <Typography>{translate('Label.ReasonForDispute')}</Typography>
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
          <Grid item container className={activeStep === 0 ? '' : hiddenContainer}>
            <ReasonForm
              claimantName={claimantName}
              isDevMarketplace={isClaimedContentDevMarketplace}
            />
          </Grid>
          <Grid item container className={activeStep === 1 ? '' : hiddenContainer}>
            <DocumentForm />
          </Grid>
          <Grid item container className={activeStep === 2 ? '' : hiddenContainer}>
            <LegalForm />
          </Grid>
          <Footer
            handleClose={handleClose}
            handleSubmit={handleSubmit}
            activeStep={activeStep}
            setActiveStep={setActiveStep}
            isNextEnabled={isNextEnabled}
            accountId={accountId}
            claimId={claimId}
            claimItemId={claimItemId}
          />
        </Grid>
      </Dialog>
    </FormProvider>
  );
};
export default withTranslation(DisputeForm, [TranslationNamespace.RightsPortal]);
