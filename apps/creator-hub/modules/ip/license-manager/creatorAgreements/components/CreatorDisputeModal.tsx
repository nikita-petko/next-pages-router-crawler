import type { FunctionComponent } from 'react';
import { useState, useEffect, useId } from 'react';
import { DisputeReason } from '@rbx/client-content-licensing-api/v1';
import {
  Checkbox,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogTitle,
  Radio,
  RadioGroup,
} from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { Stepper, Step, StepLabel, Button, FormControlLabel, FormHelperText, Link } from '@rbx/ui';
import { foundationRadioLabel } from '../../agreements/components/foundationRadioLabel';
import { FAIR_USE_HREF } from '../../urls';
import {
  LicenseManagerClickEvent,
  LicenseManagerImpressionEvent,
  useLicenseManagerLogger,
} from '../../utils/logger';
import useCreatorDisputeModalStyles from './CreatorDisputeModal.styles';

const DISPUTE_REASON_FROM_RADIO_VALUE: Record<string, DisputeReason> = {
  [DisputeReason.IPNotUsed]: DisputeReason.IPNotUsed,
  [DisputeReason.FairUse]: DisputeReason.FairUse,
  [DisputeReason.IPRemoved]: DisputeReason.IPRemoved,
};

function disputeReasonFromRadioValue(value: string): DisputeReason | undefined {
  return DISPUTE_REASON_FROM_RADIO_VALUE[value];
}

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
  const rightsholderCheckboxLabelId = useId();
  const fraudulentCheckboxLabelId = useId();

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
    <Dialog open={isOpen} size='Large' isModal hasCloseAffordance={false}>
      <DialogContent>
        <DialogTitle className='margin-none margin-left-small padding-top-xlarge padding-left-medium text-heading-small'>
          {translate('Heading.DisputeLicenseOffer')}
        </DialogTitle>
        <DialogBody className='min-height-[350px]'>
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
              value={reason ?? ''}
              onValueChange={(value) => {
                const next = disputeReasonFromRadioValue(value);
                handleRadioChange(next ?? null);
              }}
              size='Medium'>
              <div className={classes.option}>
                <Radio
                  value={DisputeReason.IPNotUsed}
                  label={foundationRadioLabel(
                    <>
                      <div className='text-body-large content-primary'>
                        {translate('Label.DisputeReasonNotUsingIP')}
                      </div>
                      <div className='text-body-medium content-muted'>
                        {translate('Label.DisputeReasonNotUsingIPSupport')}
                      </div>
                    </>,
                  )}
                />
              </div>
              <div className={classes.option}>
                <Radio
                  value={DisputeReason.FairUse}
                  label={foundationRadioLabel(
                    <>
                      <div className='text-body-large content-primary'>
                        {translate('Label.DisputeReasonFairUse')}
                      </div>
                      <div className='text-body-medium content-muted'>
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
                      </div>
                    </>,
                  )}
                />
              </div>
              <div className={classes.option}>
                <Radio
                  value={DisputeReason.IPRemoved}
                  label={foundationRadioLabel(
                    <>
                      <div className='text-body-large content-primary'>
                        {translate('Label.DisputeReasonIPRemoved')}
                      </div>
                      <div className='text-body-medium content-muted'>
                        {translate('Label.DisputeReasonIPRemovedSupport')}
                      </div>
                    </>,
                  )}
                />
              </div>
            </RadioGroup>
          )}
          {activeStep === Steps.LegalAgreements && (
            <div className={`${classes.legalAgreementsStepContent} flex flex-col gap-medium`}>
              <FormControlLabel
                classes={{ root: classes.disputeCheckboxFormLabel }}
                control={
                  <span className={classes.disputeCheckboxControlSlot}>
                    <Checkbox
                      isChecked={isRightsholderChecked}
                      color='primary'
                      size='Small'
                      placement='Start'
                      aria-labelledby={rightsholderCheckboxLabelId}
                      onCheckedChange={(value) => handleRightsholderCheckboxChange(value === true)}
                      data-testid='rightsholder-checkbox'
                    />
                  </span>
                }
                label={
                  <span
                    id={rightsholderCheckboxLabelId}
                    className='text-body-large content-primary'>
                    {translate('Label.IUnderstandRightsholderReviews')}
                  </span>
                }
              />
              <FormControlLabel
                classes={{ root: classes.disputeCheckboxFormLabel }}
                control={
                  <span className={classes.disputeCheckboxControlSlot}>
                    <Checkbox
                      isChecked={isFradulentChecked}
                      color='primary'
                      size='Small'
                      placement='Start'
                      aria-labelledby={fraudulentCheckboxLabelId}
                      onCheckedChange={(value) => handleFradulentCheckboxChange(value === true)}
                      data-testid='fradulent-checkbox'
                    />
                  </span>
                }
                label={
                  <span id={fraudulentCheckboxLabelId} className='text-body-large content-primary'>
                    {translate('Label.IUnderstandFradulentDisputes')}
                  </span>
                }
              />
            </div>
          )}
          {error && (
            <FormHelperText className={classes.error} error>
              {translate(error)}
            </FormHelperText>
          )}
        </DialogBody>
        <DialogFooter className='flex flex-col gap-small'>
          <div className='flex flex-row justify-between items-center width-full'>
            <Button
              size='large'
              variant='contained'
              color='secondary'
              type='button'
              onClick={onCancelDispute}
              disabled={isSubmitting}>
              {translate('Action.Cancel')}
            </Button>
            <div className='flex flex-row gap-small'>
              {activeStep === Steps.LegalAgreements && (
                <Button
                  variant='contained'
                  color='secondary'
                  type='button'
                  onClick={onPrev}
                  disabled={isSubmitting}>
                  {translate('Action.Back')}
                </Button>
              )}
              <Button
                variant='contained'
                color='primaryBrand'
                type='button'
                onClick={onNext}
                disabled={isSubmitting}
                loading={isSubmitting}>
                {activeStep === Steps.ReasonForDispute
                  ? translate('Action.Next')
                  : translate('Action.Dispute')}
              </Button>
            </div>
          </div>
        </DialogFooter>
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
    <Dialog open={isOpen && !isConfirmed} size='Medium' isModal hasCloseAffordance={false}>
      <DialogContent>
        <DialogBody className='flex flex-col gap-y-xsmall'>
          <DialogTitle className='text-heading-small margin-y-none padding-bottom-xsmall'>
            {translate('Heading.AreYouSure')}
          </DialogTitle>
          <span className='text-body-medium content-muted margin-none'>
            {translate('Description.FinalDisputeInfo')}
          </span>
        </DialogBody>
        <DialogFooter className='flex flex-col gap-small small:flex-row small:justify-end'>
          <Button
            variant='contained'
            color='secondary'
            onClick={onCancelConfirmation}
            disabled={isSubmitting}>
            {translate('Action.Cancel')}
          </Button>
          <Button
            variant='contained'
            color='primaryBrand'
            onClick={handleContinueConfirmation}
            disabled={isSubmitting}>
            {translate('Action.Continue')}
          </Button>
        </DialogFooter>
      </DialogContent>
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
