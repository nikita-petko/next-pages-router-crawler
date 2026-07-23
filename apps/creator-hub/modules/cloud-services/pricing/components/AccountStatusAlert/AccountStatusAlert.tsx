import React, { FunctionComponent, useCallback, useMemo } from 'react';
import { Alert, AlertTitle, Button, useDialog } from '@rbx/ui';
import { CreatorType } from '@modules/miscellaneous/common';
import { useRouter } from 'next/router';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useTranslationWrapper, translationKey } from '@modules/analytics-translations';
import CloudPricingClientProvider from '../../CloudPricingClientProvider';
import useAccountStatusAlertStyles from './AccountStatusAlert.styles';
import RetryPaymentDialog from '../RetryPaymentDialog/RetryPaymentDialog';
import { BillDetails, Money, ResponseAccountState, TransactionStatus } from '../../types';
import useTopMessage from '../../../utils/useTopMessage';

interface AccountStatusAlertProps {
  accountState: string;
  latestBill: BillDetails | null;
  creatorType: CreatorType;
  creatorId: number;
  displayMissingPaymentAlert: boolean;
}

const AccountStatusAlert: FunctionComponent<AccountStatusAlertProps> = ({
  accountState,
  latestBill,
  creatorType,
  creatorId,
  displayMissingPaymentAlert,
}) => {
  const {
    classes: { container },
  } = useAccountStatusAlertStyles();

  const router = useRouter();
  const { open, close, configure } = useDialog();
  const { showFailureMessage } = useTopMessage();
  const { translate } = useTranslationWrapper(useTranslation());

  const closeDialog = useCallback(
    (status: boolean) => {
      close();
      if (!status) {
        showFailureMessage(
          translate(
            translationKey('Description.PaymentFailed', TranslationNamespace.CloudServices),
          ),
        );
      }
    },
    [close, translate, showFailureMessage],
  );

  const manualPaymentDialog = useMemo(
    () =>
      latestBill && latestBill.billId ? (
        <CloudPricingClientProvider>
          <RetryPaymentDialog
            balance={latestBill.totalAmount as Money}
            billId={latestBill.billId}
            creatorType={creatorType}
            creatorId={creatorId}
            closeDialog={closeDialog}
          />
        </CloudPricingClientProvider>
      ) : null,
    [latestBill, closeDialog, creatorType, creatorId],
  );

  const onManualPaymentCreate = useCallback(() => {
    configure(manualPaymentDialog);
    open();
  }, [configure, open, manualPaymentDialog]);

  if (accountState === ResponseAccountState.Overdue) {
    return (
      <Alert
        action={
          <Button onClick={onManualPaymentCreate} color='inherit' size='small'>
            {translate(translationKey('Action.RetryPayment', TranslationNamespace.CloudServices))}
          </Button>
        }
        severity='warning'
        variant='filled'
        className={container}>
        <AlertTitle>
          {translate(
            translationKey('Title.PaymentFailedAccOverdue', TranslationNamespace.CloudServices),
          )}
        </AlertTitle>
        {translate(
          translationKey('Description.PaymentFailedAccOverdue', TranslationNamespace.CloudServices),
        )}
      </Alert>
    );
  }

  // We can be suspended for three reasons currently:
  // 1. If the last bill had an unsuccessful payment
  // 2. If the account has one or more missing eligibility requirements
  // 3. The account does not have any or a default payment method.
  if (accountState === ResponseAccountState.Suspended) {
    // If we have no payment method, we need to add one
    if (displayMissingPaymentAlert) {
      return (
        <Alert severity='error' variant='filled' className={container}>
          <AlertTitle>
            {translate(
              translationKey('Title.AccountSuspendedAlert', TranslationNamespace.CloudServices),
            )}
          </AlertTitle>
          {translate(
            translationKey(
              'Description.MissingPaymentSuspension',
              TranslationNamespace.CloudServices,
            ),
          )}
        </Alert>
      );
    }
    // If our latestBill does not exist, or our latestBill has no payments, or our latestBill has a successful payment, then we are missing eligibility
    if (
      !latestBill ||
      latestBill.payments.length === 0 ||
      latestBill?.payments[0].status === TransactionStatus.Successful
    ) {
      return (
        <Alert
          action={
            <Button
              onClick={() => router.push('/settings/eligibility')}
              color='inherit'
              size='small'>
              {translate(
                translationKey('Action.UpdateEligibility', TranslationNamespace.CloudServices),
              )}
            </Button>
          }
          severity='error'
          variant='filled'
          className={container}>
          <AlertTitle>
            {translate(
              translationKey('Title.AccountSuspendedAlert', TranslationNamespace.CloudServices),
            )}
          </AlertTitle>
          {translate(
            translationKey(
              'Description.MissingEligibilitySuspension',
              TranslationNamespace.CloudServices,
            ),
          )}
        </Alert>
      );
    }
    // If the previous bill exists, has had a payment and that payment failed then we must retry payment
    if (
      latestBill &&
      latestBill.payments.length !== 0 &&
      latestBill.payments[0].status === TransactionStatus.Failed
    ) {
      return (
        <Alert
          action={
            <Button onClick={onManualPaymentCreate} color='inherit' size='small'>
              {translate(translationKey('Action.RetryPayment', TranslationNamespace.CloudServices))}
            </Button>
          }
          severity='error'
          variant='filled'
          className={container}>
          <AlertTitle>
            {translate(
              translationKey('Title.AccountSuspendedAlert', TranslationNamespace.CloudServices),
            )}
          </AlertTitle>
          {translate(
            translationKey('Description.AccountSuspendedAlert', TranslationNamespace.CloudServices),
          )}
        </Alert>
      );
    }
  }
  return null;
};

export default withTranslation(AccountStatusAlert, [TranslationNamespace.CloudServices]);
