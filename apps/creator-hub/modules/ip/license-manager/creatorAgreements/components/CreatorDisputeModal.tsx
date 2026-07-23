import { FunctionComponent, useState, useEffect } from 'react';
import {
  Grid,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  RadioGroup,
  Radio,
  FormControlLabel,
  FormHelperText,
  Checkbox,
  Link,
} from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { DisputeReason } from '@rbx/clients/contentLicensingApi/v1';

import { FAIR_USE_HREF } from '../../urls';
import useCreatorDisputeModalStyles from './CreatorDisputeModal.styles';
import {
  LicenseManagerClickEvent,
  LicenseManagerImpressionEvent,
  useLicenseManagerLogger,
} from '../../utils/logger';

enum Steps {
  ReasonForDispute = 0,
  LegalAgreements = 1,
}

interface CreatorDisputeModalProps {
  agreementId: string;
  isOpen: boolean;
  showConfirmation: boolean;
  closeModal: () => void;
  submitDispute: (reason: DisputeReason) => void;
  isSubmitting?: boolean;
}

const CreatorDisputeModal: FunctionComponent<CreatorDisputeModalProps> = ({
  agreementId,
  isOpen,
  showConfirmation,
  closeModal,
  submitDispute,
  isSubmitting = false,
}) => {
  const { translate, translateHTML } = useTranslation();
  const { classes } = useCreatorDisputeModalStyles();
  const { logEvent } = useLicenseManagerLogger();

  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<Steps>(Steps.ReasonForDispute);
  const [reason, setReason] = useState<DisputeReason | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRightsholderChecked, setIsRightsholderChecked] = useState<boolean>(false);
  const [isFradulentChecked, setIsFradulentChecked] = useState<boolean>(false);

  // Handles the next and submit actions on the Submit Dispute Modal
  const onNext = () => {
    if (activeStep === Steps.ReasonForDispute && !reason) {
      setError('Label.ErrorNoDisputeReasonSelected');
      return;
    }
    if (activeStep === Steps.LegalAgreements && (!isRightsholderChecked || !isFradulentChecked)) {
      setError('Label.ErrorCheckboxesNotChecked');
      return;
    }
    if (activeStep === Steps.LegalAgreements && reason) {
      submitDispute(reason);
      closeModal();
    } else {
      logEvent(
        LicenseManagerImpressionEvent.CreatorAgreementDetailsPageDisputeStepAcknowledgeTermsImpressionEvent,
        {
          agreementId,
        },
      );

      setActiveStep(activeStep + 1);
    }
  };

  // Handles the prev action on the Submit Dispute modal
  const onPrev = () => {
    logEvent(
      LicenseManagerImpressionEvent.CreatorAgreementDetailsPageDisputeStepSelectReasonImpressionEvent,
      {
        agreementId,
      },
    );

    setError(null);
    setActiveStep(activeStep - 1);
  };

  // Handles the cancel action on the Submit Dispute modal
  const onCancelDispute = () => {
    logEvent(LicenseManagerClickEvent.CreatorAgreementDetailsPageCloseDisputeModalClickEvent, {
      agreementId,
      activeStep: Steps[activeStep],
    });

    closeModal();
    setError(null);
    setReason(null);
    setIsRightsholderChecked(false);
    setIsFradulentChecked(false);
    setActiveStep(Steps.ReasonForDispute);
    setIsConfirmed(false);
  };

  const handleRadioChange = (selectedReason: DisputeReason | null) => {
    setError(null);
    setReason(selectedReason);
  };

  const handleRightsholderCheckboxChange = (isChecked: boolean) => {
    if (isChecked && isFradulentChecked) {
      setError(null);
    }
    setIsRightsholderChecked(isChecked);
  };

  const handleFradulentCheckboxChange = (isChecked: boolean) => {
    if (isChecked && isRightsholderChecked) {
      setError(null);
    }
    setIsFradulentChecked(isChecked);
  };

  const renderMainContent = () => (
    <Dialog fullWidth maxWidth='Large' open={isOpen}>
      <DialogTitle>
        <Typography variant='h4' className={classes.title}>
          {translate('Heading.DisputeLicenseOffer')}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onNext();
          }}>
          <Stepper activeStep={activeStep} className={classes.stepper}>
            <Step>
              <StepLabel>{translate('Label.ReasonForDispute')}</StepLabel>
            </Step>
            <Step>
              <StepLabel>{translate('Label.LegalAgreements')}</StepLabel>
            </Step>
          </Stepper>
          {activeStep === Steps.ReasonForDispute && (
            <RadioGroup
              className={classes.stepContent}
              value={reason}
              onChange={(event) => handleRadioChange(event.target.value as DisputeReason)}>
              <FormControlLabel
                className={classes.option}
                value={DisputeReason.IPNotUsed}
                control={<Radio aria-label={translate('Label.DisputeReasonNotUsingIP')} />}
                label={
                  <Grid container flexDirection='column'>
                    <Typography variant='body1'>
                      {translate('Label.DisputeReasonNotUsingIP')}
                    </Typography>
                    <Typography variant='body2' color='secondary'>
                      {translate('Label.DisputeReasonNotUsingIPSupport')}
                    </Typography>
                  </Grid>
                }
              />
              <FormControlLabel
                className={classes.option}
                value={DisputeReason.FairUse}
                control={<Radio aria-label={translate('Label.DisputeReasonFairUse')} />}
                label={
                  <Grid container flexDirection='column'>
                    <Typography variant='body1'>
                      {translate('Label.DisputeReasonFairUse')}
                    </Typography>
                    <Typography variant='body2' color='secondary'>
                      {translateHTML('Label.DisputeReasonFairUseSupport', [
                        {
                          opening: 'linkStart',
                          closing: 'linkEnd',
                          content(chunks) {
                            return (
                              <Link href={FAIR_USE_HREF} target='_blank'>
                                {chunks}
                              </Link>
                            );
                          },
                        },
                      ])}
                    </Typography>
                  </Grid>
                }
              />
              <FormControlLabel
                className={classes.option}
                value={DisputeReason.IPRemoved}
                control={<Radio aria-label={translate('Label.DisputeReasonIPRemoved')} />}
                label={
                  <Grid container flexDirection='column'>
                    <Typography variant='body1'>
                      {translate('Label.DisputeReasonIPRemoved')}
                    </Typography>
                    <Typography variant='body2' color='secondary'>
                      {translate('Label.DisputeReasonIPRemovedSupport')}
                    </Typography>
                  </Grid>
                }
              />
            </RadioGroup>
          )}
          {activeStep === Steps.LegalAgreements && (
            <Grid container className={classes.stepContent}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isRightsholderChecked}
                    color='primary'
                    size='medium'
                    onChange={(event) => handleRightsholderCheckboxChange(event.target.checked)}
                    data-testid='rightsholder-checkbox'
                  />
                }
                className={classes.option}
                label={translate('Label.IUnderstandRightsholderReviews')}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isFradulentChecked}
                    color='primary'
                    size='medium'
                    onChange={(event) => handleFradulentCheckboxChange(event.target.checked)}
                    data-testid='fradulent-checkbox'
                  />
                }
                className={classes.option}
                label={translate('Label.IUnderstandFradulentDisputes')}
              />
            </Grid>
          )}
          {error && (
            <FormHelperText className={classes.error} error>
              {translate(error)}
            </FormHelperText>
          )}
          <DialogActions>
            <Grid container flexDirection='row' justifyContent='space-between' spacing={1.5}>
              <Grid item>
                <Button
                  size='large'
                  variant='contained'
                  color='secondary'
                  onClick={onCancelDispute}
                  disabled={isSubmitting}>
                  {translate('Action.Cancel')}
                </Button>
              </Grid>
              <Grid item container width='auto'>
                {activeStep === Steps.LegalAgreements && (
                  <Grid item paddingRight={1}>
                    <Button
                      size='large'
                      variant='contained'
                      color='secondary'
                      onClick={onPrev}
                      disabled={isSubmitting}>
                      {translate('Action.Back')}
                    </Button>
                  </Grid>
                )}
                <Grid item>
                  <Button
                    size='large'
                    variant='contained'
                    color='primaryBrand'
                    type='submit'
                    disabled={isSubmitting}
                    loading={isSubmitting}>
                    {activeStep === Steps.ReasonForDispute
                      ? translate('Action.Next')
                      : translate('Action.Dispute')}
                  </Button>
                </Grid>
              </Grid>
            </Grid>
          </DialogActions>
        </form>
      </DialogContent>
    </Dialog>
  );

  // Handles the cancel action on the Confirm Final Dispute modal
  const onCancelConfirmation = () => {
    setIsConfirmed(false);
    closeModal();
  };

  // Handles the continue action on the Confirm Final Dispute modal
  const handleContinueConfirmation = () => {
    setIsConfirmed(true);
  };

  const renderConfirmationModal = () => (
    <Dialog fullWidth maxWidth='Medium' open={isOpen && !isConfirmed}>
      <DialogTitle>
        <Typography variant='h5'>{translate('Heading.AreYouSure')}</Typography>
      </DialogTitle>
      <DialogContent>
        <Typography variant='body1' color='secondary'>
          {translate('Description.FinalDisputeInfo')}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Grid container flexDirection='row' justifyContent='flex-end' spacing={1.5}>
          <Grid item>
            <Button
              size='large'
              variant='contained'
              color='secondary'
              onClick={onCancelConfirmation}
              disabled={isSubmitting}>
              {translate('Action.Cancel')}
            </Button>
          </Grid>
          <Grid item>
            <Button
              size='large'
              variant='contained'
              color='primaryBrand'
              onClick={handleContinueConfirmation}
              disabled={isSubmitting}>
              {translate('Action.Continue')}
            </Button>
          </Grid>
        </Grid>
      </DialogActions>
    </Dialog>
  );

  useEffect(() => {
    if (isOpen) {
      if (showConfirmation && !isConfirmed) {
        logEvent(
          LicenseManagerImpressionEvent.CreatorAgreementDetailsPageMaxDisputeConfirmationModalImpressionEvent,
          {
            agreementId,
          },
        );
      } else {
        logEvent(
          LicenseManagerImpressionEvent.CreatorAgreementDetailsPageDisputeStepSelectReasonImpressionEvent,
          {
            agreementId,
          },
        );
      }
    }
  }, [agreementId, isOpen, isConfirmed, showConfirmation, logEvent]);

  if (showConfirmation && !isConfirmed) {
    if (isOpen) {
      return renderConfirmationModal();
    }
    // Prevent visual flash of main content when cancel is selected
    return null;
  }

  return renderMainContent();
};

export default CreatorDisputeModal;
