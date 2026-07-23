import React, { FunctionComponent } from 'react';
import { AlertTitle, Alert, Button } from '@rbx/ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { useTranslationWrapper, translationKey } from '@modules/analytics-translations';
import TranslationNamespace from '@modules/miscellaneous/localization/enums/TranslationNamespace';
import useUnlockServiceAlertStyles from './UnlockServiceAlert.styles';

export type TUnlockServiceAlertProps = {
  account: boolean;
  paymentProfiles: boolean;
  paymentProfile: boolean;
  onCreate: () => void;
};

const UnlockServiceAlert: FunctionComponent<TUnlockServiceAlertProps> = ({
  account,
  paymentProfiles,
  paymentProfile,
  onCreate,
}) => {
  const {
    classes: { alertButtonText, alertContainer, alertTitleText },
  } = useUnlockServiceAlertStyles();
  const { translate } = useTranslationWrapper(useTranslation());

  // There are six states a user can be in on the Unlock page
  // 1. Missing account info and payment information -> Must fill out all info
  // 2. Missing account info and default payment method -> Must fill out account info and select default card
  // 3. Missing payment methods -> Must add a payment method
  // 4. Missing account info -> Must fill out account info
  // 5. Missing default payment method -> Must select default card
  // 6. All info is filled out -> No alert is displayed
  const getAlertDetails = () => {
    if (!account && (!paymentProfiles || !paymentProfile)) {
      // Missing all information
      return {
        alertButton: translate(
          translationKey('Label.MissingAccountAndPaymentInfo', TranslationNamespace.CloudServices),
        ),
        alertTitle: translate(
          translationKey('Header.MissingAccountAndPaymentInfo', TranslationNamespace.CloudServices),
        ),
        alertDescription: translate(
          translationKey(
            'Description.MissingAccountAndPaymentInfo',
            TranslationNamespace.CloudServices,
          ),
        ),
      };
    }
    if (!account) {
      // Missing account information only
      return {
        alertButton: translate(
          translationKey('Label.MissingAccountInfo', TranslationNamespace.CloudServices),
        ),
        alertTitle: translate(
          translationKey('Header.MissingAccountInfo', TranslationNamespace.CloudServices),
        ),
        alertDescription: translate(
          translationKey('Description.MissingAccountInfo', TranslationNamespace.CloudServices),
        ),
      };
    }
    if (!paymentProfiles || !paymentProfile) {
      // Missing default or any payment methods
      return {
        alertButton: translate(
          translationKey('Label.AddPaymentMethod', TranslationNamespace.CloudServices),
        ),
        alertTitle: translate(
          translationKey('Header.MissingPaymentInformation', TranslationNamespace.CloudServices),
        ),
        alertDescription: translate(
          translationKey(
            'Description.MissingPaymentInformation',
            TranslationNamespace.CloudServices,
          ),
        ),
      };
    }

    return {};
  };

  const { alertButton, alertTitle, alertDescription } = getAlertDetails();

  if (!(account && paymentProfiles && paymentProfile)) {
    return (
      <Alert
        action={
          <Button onClick={onCreate} className={alertButtonText} color='inherit' size='small'>
            {alertButton}
          </Button>
        }
        severity='warning'
        variant='outlined'
        className={alertContainer}>
        <AlertTitle className={alertTitleText}>{alertTitle}</AlertTitle>
        {alertDescription}
      </Alert>
    );
  }

  return null;
};

export default withTranslation(UnlockServiceAlert, [TranslationNamespace.CloudServices]);
