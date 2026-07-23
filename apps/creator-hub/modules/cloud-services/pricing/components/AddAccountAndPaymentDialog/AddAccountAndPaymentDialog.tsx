import React, { FunctionComponent, useCallback, useMemo, useState } from 'react';
import { Dialog, DialogContent, Divider, Step, Stepper, StepLabel, Typography } from '@rbx/ui';
import { CreatorType } from '@modules/miscellaneous/common';
import { useTranslation, withTranslation } from '@rbx/intl';
import { useTranslationWrapper, translationKey } from '@modules/analytics-translations';
import TranslationNamespace from '@modules/miscellaneous/localization/enums/TranslationNamespace';
import AddAccountSettingsInfoDialog from '../AddAccountSettingsInfoDialog/AddAccountSettingsInfoDialog';
import useAddAccountAndPaymentDialogStyles from './AddAccountAndPaymentDialog.styles';
import StripeElementsProvider from '../StripeElementsProvider/StripeElementsProvider';
import SelectPaymentMethod from '../SelectPaymentMethod/SelectPaymentMethod';
import { DialogResponseStatusEnum, CardVerificationResultEnum } from '../shared/stripeConstants';
import { Account, PaymentProfile, StripeAddress } from '../../types';
import ReviewAndSave from '../ReviewAndSave/ReviewAndSave';
import { useCloudPricingClient } from '../../CloudPricingClientProvider';

export interface AddAccountAndPaymentDialogProps {
  creatorType: CreatorType;
  creatorId: number;
  userId: number;
  savedPayments: boolean;
  closeDialog: () => void;
  saveStatus: (dialogResponse: DialogResponseStatusEnum) => void;
}
const AddAccountAndPaymentDialog: FunctionComponent<AddAccountAndPaymentDialogProps> = ({
  creatorType,
  creatorId,
  userId,
  savedPayments = false,
  closeDialog,
  saveStatus,
}) => {
  const {
    classes: { topDivider, upperStepper, addPaymentMethodHeader, addPaymentMethodDescription },
  } = useAddAccountAndPaymentDialogStyles();

  const [step, setStep] = useState(0);
  const [savedAccountInfo, setSavedAccountInfo] = useState<Account>();
  const [savedPaymentInfo, setSavedPaymentInfo] = useState<PaymentProfile>();
  const [name, setName] = useState<string>();
  const [address, setAddress] = useState<StripeAddress>();
  const cloudPricingClient = useCloudPricingClient();
  const { translate } = useTranslationWrapper(useTranslation());

  const nextStepper = useCallback((payment: PaymentProfile) => {
    setSavedPaymentInfo(payment);
    setStep(2);
  }, []);

  const confirmAddressAndCard = useCallback(
    async (userName: string, stripeAddress: StripeAddress) => {
      setName(userName);
      setAddress(stripeAddress);
      try {
        const response = await cloudPricingClient.listPaymentProfiles(creatorId);
        if (response !== null && response?.paymentProfiles !== null) {
          setSavedPaymentInfo(response.paymentProfiles[response.paymentProfiles.length - 1]);
          setStep(2);
        } else {
          saveStatus(DialogResponseStatusEnum.FAILED);
        }
      } catch {
        saveStatus(DialogResponseStatusEnum.FAILED);
      }
    },
    [cloudPricingClient, saveStatus, creatorId],
  );

  const propagateStripeResponse = useCallback(
    async (stripeResponse: CardVerificationResultEnum) => {
      if (stripeResponse !== CardVerificationResultEnum.SUCCESS) {
        saveStatus(DialogResponseStatusEnum.FAILED);
        closeDialog();
      }
    },
    [saveStatus, closeDialog],
  );

  const handleBackToPayment = useCallback(() => {
    setStep(1);
  }, []);

  // Account form is always first, so if we get a successful response here iterate to next step
  // If we do not, bail out with an error message
  const handleAccountFormResponse = useCallback(
    (accountInfo: Account) => {
      setSavedAccountInfo(accountInfo);
      setStep(1);
    },
    [setSavedAccountInfo],
  );

  const stepDialog = useMemo(() => {
    // first step is to add in account information
    if (step === 0) {
      return (
        <AddAccountSettingsInfoDialog
          closeDialog={closeDialog}
          saveAccountResponse={handleAccountFormResponse}
          forStep
        />
      );
    }

    // if we don't have saved payment methods, next step is to add a payment method
    if (savedPayments !== true && step === 1) {
      return (
        <div>
          <Typography variant='h6' className={addPaymentMethodHeader}>
            {translate(
              translationKey('Label.AddPaymentMethod', TranslationNamespace.CloudServices),
            )}
          </Typography>
          <Typography variant='body2' className={addPaymentMethodDescription}>
            {translate(
              translationKey('Description.AddPaymentMethod', TranslationNamespace.CloudServices),
            )}
          </Typography>
          <StripeElementsProvider
            creatorId={userId}
            setAsDefault
            step={1}
            enableDialog={false}
            closeDialog={() => setStep(0)}
            confirmAddressAndCard={confirmAddressAndCard}
            handleStripeResponse={propagateStripeResponse}
          />
        </div>
      );
    }
    if (savedPayments === true && step === 1) {
      return (
        <div>
          <Typography variant='h6' className={addPaymentMethodHeader}>
            {translate(
              translationKey('Header.ChoosePaymentMethod', TranslationNamespace.CloudServices),
            )}
          </Typography>
          <Typography variant='body2' color='secondary' className={addPaymentMethodDescription}>
            {translate(
              translationKey('Description.AddPaymentMethod', TranslationNamespace.CloudServices),
            )}
          </Typography>
          <SelectPaymentMethod
            creatorType={creatorType}
            creatorId={creatorId}
            userId={userId}
            nextStepper={nextStepper}
            closeDialog={() => setStep(0)}
            saveStatus={() => setStep(2)}
            step={1}
          />
        </div>
      );
    }

    if (step === 2 && savedAccountInfo && savedPaymentInfo) {
      return (
        <ReviewAndSave
          creatorId={creatorId}
          creatorType={creatorType}
          savedAccountInfo={savedAccountInfo}
          savedPaymentInfo={savedPaymentInfo}
          name={name}
          address={address}
          handleBackToPayment={handleBackToPayment}
          saveStatus={saveStatus}
        />
      );
    }

    return null;
  }, [
    step,
    creatorType,
    creatorId,
    userId,
    addPaymentMethodDescription,
    addPaymentMethodHeader,
    nextStepper,
    closeDialog,
    handleAccountFormResponse,
    savedPayments,
    address,
    confirmAddressAndCard,
    handleBackToPayment,
    name,
    saveStatus,
    savedAccountInfo,
    savedPaymentInfo,
    propagateStripeResponse,
    translate,
  ]);

  return (
    <Dialog open scroll='body' onClose={closeDialog} fullWidth maxWidth='Large'>
      <DialogContent>
        <Typography variant='h5'>
          {translate(
            translationKey('Label.AddAccountAndPaymentInfo', TranslationNamespace.CloudServices),
          )}
        </Typography>
        <Divider className={topDivider} />
        <Stepper activeStep={step} orientation='horizontal' className={upperStepper}>
          <Step>
            <StepLabel>
              {translate(
                translationKey('Label.AccountInfoStepper', TranslationNamespace.CloudServices),
              )}
            </StepLabel>
          </Step>
          <Step>
            <StepLabel>
              {translate(
                translationKey('Label.PaymentMethodStepper', TranslationNamespace.CloudServices),
              )}
            </StepLabel>
          </Step>
          <Step>
            <StepLabel>
              {translate(translationKey('Label.ReviewAndSave', TranslationNamespace.CloudServices))}
            </StepLabel>
          </Step>
        </Stepper>
        {stepDialog}
      </DialogContent>
    </Dialog>
  );
};

export default withTranslation(AddAccountAndPaymentDialog, [TranslationNamespace.CloudServices]);
