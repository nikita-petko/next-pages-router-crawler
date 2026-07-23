import React, { FunctionComponent, useCallback, useEffect, useState } from 'react';
import { Button, Grid, Dialog, DialogContent, Divider, Typography } from '@rbx/ui';
import { CreatorType } from '@modules/miscellaneous/common';
import { useTranslation, withTranslation } from '@rbx/intl';
import { useTranslationWrapper, translationKey } from '@modules/analytics-translations';
import TranslationNamespace from '@modules/miscellaneous/localization/enums/TranslationNamespace';
import useRetryPaymentDialogStyles from './RetryPaymentDialog.styles';
import { useCloudPricingClient } from '../../CloudPricingClientProvider';
import { PaymentProfile, Money } from '../../types';
import PaymentMethodIcons from '../PaymentMethodIcons/PaymentMethodIcons';
import { currencyMoneyFormatter } from '../../../utils/formatters';

export interface RetryPaymentDialogProps {
  balance: Money;
  billId: string;
  creatorType: CreatorType;
  creatorId: number;
  closeDialog: (status: true | false) => void;
}

const RetryPaymentDialog: FunctionComponent<RetryPaymentDialogProps> = ({
  balance,
  billId,
  creatorType,
  creatorId,
  closeDialog,
}) => {
  const {
    classes: {
      addPaymentMethodHeader,
      addPaymentMethodDescription,
      buttonContainer,
      closeButton,
      paymentIcons,
      paymentContainer,
      headingDivider,
      headingDescription,
      topDivider,
    },
  } = useRetryPaymentDialogStyles();
  const cloudPricingClient = useCloudPricingClient();
  const [defaultPayment, setDefaultPayment] = useState<PaymentProfile | null>(null);
  const { translate } = useTranslationWrapper(useTranslation());
  const getDefaultPayment = useCallback(async () => {
    const defaultRes = await cloudPricingClient.getPaymentProfiles(creatorType, creatorId);
    setDefaultPayment(defaultRes);
  }, [cloudPricingClient, creatorType, creatorId]);

  const submitManualPayment = async () => {
    if (creatorType && creatorId && balance && billId) {
      try {
        await cloudPricingClient.submitManualPayment(creatorType, creatorId, balance, billId);
      } catch {
        closeDialog(false);
      }
    }
  };

  useEffect(() => {
    if (creatorType && creatorId) {
      getDefaultPayment();
    }
  }, [creatorType, creatorId, getDefaultPayment]);

  return (
    <Dialog open scroll='body' maxWidth='Medium'>
      <DialogContent>
        <Grid container justifyContent='center'>
          <Typography variant='h3' className={addPaymentMethodHeader}>
            {translate(translationKey('Header.RetryPayment', TranslationNamespace.CloudServices))}
          </Typography>
        </Grid>
        <Divider className={headingDivider} />
        <div className={headingDescription}>
          <Typography variant='body1'>
            {translate(
              translationKey('Description.RetryPayment', TranslationNamespace.CloudServices),
            )}
          </Typography>
        </div>
        <Grid container item XSmall={12}>
          <Grid item XSmall>
            <Typography variant='body1' color='primary' className={addPaymentMethodDescription}>
              {translate(translationKey('Label.AmountToPay', TranslationNamespace.CloudServices))}
            </Typography>
          </Grid>
          <Grid item XSmall={8}>
            <Typography variant='body1' color='primary' className={addPaymentMethodDescription}>
              {currencyMoneyFormatter(balance)}
            </Typography>
          </Grid>
        </Grid>
        <Divider className={topDivider} />
        <Grid container item XSmall={12}>
          <Grid item XSmall>
            <Typography variant='body1' color='primary' className={addPaymentMethodDescription}>
              {translate(translationKey('Label.PayUsing', TranslationNamespace.CloudServices))}
            </Typography>
          </Grid>
          <Grid item XSmall={8}>
            <Typography variant='body1' color='primary' className={addPaymentMethodDescription}>
              <div className={paymentIcons}>
                <div className={paymentContainer}>
                  <PaymentMethodIcons
                    paymentMethodType={
                      defaultPayment ? defaultPayment.cardNetwork || 'default' : 'default'
                    }
                    largeIcon={false}
                    smallIcon={false}
                  />
                </div>
                <span>
                  {defaultPayment ? (
                    <React.Fragment>
                      <strong>{`****  ${defaultPayment.last4Digits}`}</strong>{' '}
                      <span>{`${translate(translationKey('Label.Expires', TranslationNamespace.CloudServices))} ${defaultPayment.expMonth}/${defaultPayment.expYear}`}</span>
                    </React.Fragment>
                  ) : (
                    ''
                  )}
                </span>
              </div>
            </Typography>
            <Grid item XSmall={12}>
              <Typography variant='caption' color='primary' className={addPaymentMethodDescription}>
                {translate(
                  translationKey('Description.PayUsing', TranslationNamespace.CloudServices),
                )}
              </Typography>
            </Grid>
          </Grid>
        </Grid>
        <Divider className={topDivider} />
        <Grid container justifyContent='center'>
          <Grid item className={buttonContainer}>
            <Button
              color='primaryBrand'
              size='medium'
              variant='outlined'
              onClick={() => closeDialog(true)}
              className={closeButton}>
              {translate(translationKey('Label.Close', TranslationNamespace.CloudServices))}
            </Button>
            <Button
              onClick={submitManualPayment}
              color='primaryBrand'
              size='medium'
              variant='contained'>
              {translate(translationKey('Label.PayNow', TranslationNamespace.CloudServices))}
            </Button>
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
};

export default withTranslation(RetryPaymentDialog, [TranslationNamespace.CloudServices]);
