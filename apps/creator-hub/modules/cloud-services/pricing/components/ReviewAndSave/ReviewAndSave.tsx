import type { FunctionComponent } from 'react';
import React, { useCallback, useState } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Button, Grid, Card, CircularProgress, CardContent, Divider, Typography } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type { CreatorType } from '@modules/miscellaneous/common';
import TranslationNamespace from '@modules/miscellaneous/localization/enums/TranslationNamespace';
import { useCloudPricingClient } from '../../CloudPricingClientProvider';
import type { PaymentProfile, Account, StripeAddress } from '../../types';
import { DialogResponseStatusEnum } from '../shared/stripeConstants';
import useReviewAndSaveStyles from './ReviewAndSave.styles';

export interface ReviewAndSaveProps {
  creatorId: number;
  creatorType: CreatorType;
  savedAccountInfo: Account;
  name?: string;
  address?: StripeAddress;
  savedPaymentInfo: PaymentProfile;
  handleBackToPayment: () => void;
  saveStatus?: (status: DialogResponseStatusEnum) => void;
}

const ReviewAndSave: FunctionComponent<ReviewAndSaveProps> = ({
  creatorId,
  creatorType,
  savedAccountInfo,
  name,
  address,
  savedPaymentInfo,
  handleBackToPayment,
  saveStatus,
}) => {
  const {
    classes: {
      cardContainer,
      cardBox,
      buttonContainer,
      cardTitle,
      saveTaxId,
      saveTaxIdDescription,
      paymentDescription,
      bottomDivider,
      loadingProgress,
    },
  } = useReviewAndSaveStyles();
  const cloudPricingClient = useCloudPricingClient();
  const [confirmIsLoading, setConfirmIsLoading] = useState(false);
  const { translate } = useTranslationWrapper(useTranslation());

  const saveAllInformation = useCallback(
    async (paymentInfo: PaymentProfile, accInfo: Account) => {
      if (saveStatus) {
        try {
          if (
            accInfo &&
            paymentInfo &&
            paymentInfo?.paymentProfileId &&
            paymentInfo?.paymentProfileOwnerType
          ) {
            setConfirmIsLoading(true);
            await cloudPricingClient.updateAccountSettings(creatorId, creatorType, accInfo);
            await cloudPricingClient.setPaymentProfiles(
              creatorType,
              creatorId,
              paymentInfo?.paymentProfileId,
              paymentInfo?.paymentProfileOwnerType,
            );
            saveStatus(DialogResponseStatusEnum.SUCCESS);
          } else {
            saveStatus(DialogResponseStatusEnum.FAILED);
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- do not know error type
        } catch (error: any) {
          if (error.message === '403' || error.message === '401') {
            saveStatus(DialogResponseStatusEnum.UNAUTHORIZED);
          } else {
            saveStatus(DialogResponseStatusEnum.FAILED);
          }
        } finally {
          setConfirmIsLoading(false);
        }
      }
    },
    [cloudPricingClient, creatorId, creatorType, saveStatus],
  );

  return (
    <>
      <Grid className={cardContainer}>
        <Card className={cardBox} variant='outlined'>
          <CardContent className={cardBox}>
            <Grid container XSmall={12} direction='row' display='flex'>
              <Typography variant='h5' color='primary' className={cardTitle}>
                {translate(
                  translationKey(
                    'Heading.AccountInformationTitle',
                    TranslationNamespace.CloudServices,
                  ),
                )}
              </Typography>
              <Grid container item XSmall={12}>
                <Grid item XSmall={12}>
                  <Typography variant='smallLabel1' color='secondary' className={cardTitle}>
                    {translate(
                      translationKey('Label.FirstAndLastName', TranslationNamespace.CloudServices),
                    )}
                  </Typography>
                </Grid>
                <Grid item XSmall={12}>
                  <Typography variant='body1' color='primary' className={cardTitle}>
                    {savedAccountInfo?.accountName}
                  </Typography>
                </Grid>
              </Grid>
              {savedAccountInfo?.taxIdType && (
                <React.Fragment>
                  <Grid container item XSmall={12}>
                    <Grid item XSmall={6} className={saveTaxId}>
                      <Typography variant='smallLabel1' color='secondary'>
                        {translate(
                          translationKey('Label.SaveTaxIdType', TranslationNamespace.CloudServices),
                        )}
                      </Typography>
                    </Grid>
                    <Grid item XSmall={6} className={saveTaxId}>
                      <Typography variant='smallLabel1' color='secondary'>
                        {translate(
                          translationKey('Label.SaveTaxId', TranslationNamespace.CloudServices),
                        )}
                      </Typography>
                    </Grid>
                  </Grid>
                  <Grid container item XSmall={12}>
                    <Grid item XSmall={6} className={saveTaxIdDescription}>
                      <Typography variant='body1' color='primary'>
                        {savedAccountInfo?.taxIdType}
                      </Typography>
                    </Grid>
                    <Grid item XSmall={6} className={saveTaxIdDescription}>
                      <Typography variant='body1' color='primary'>
                        {savedAccountInfo?.taxId}
                      </Typography>
                    </Grid>
                  </Grid>
                </React.Fragment>
              )}
            </Grid>
          </CardContent>
        </Card>
      </Grid>
      <Grid className={cardContainer}>
        <Card className={cardBox} variant='outlined'>
          <CardContent className={cardBox}>
            <Grid container XSmall={12} direction='row' display='flex'>
              <Typography variant='h5' color='primary' className={cardTitle}>
                {translate(
                  translationKey(
                    'Header.PaymentInformationTitle',
                    TranslationNamespace.CloudServices,
                  ),
                )}
              </Typography>
              <Grid container item XSmall={12}>
                <Grid item XSmall={6}>
                  <Typography variant='smallLabel1' color='secondary'>
                    {translate(
                      translationKey('Label.PaymentMethod', TranslationNamespace.CloudServices),
                    )}
                  </Typography>
                </Grid>
                <Grid item XSmall={6} className={paymentDescription}>
                  <Typography variant='smallLabel1' color='secondary'>
                    {translate(
                      translationKey('Label.ExpirationDate', TranslationNamespace.CloudServices),
                    )}
                  </Typography>
                </Grid>
              </Grid>
              <Grid container item XSmall={12}>
                <Grid item XSmall={6}>
                  <Typography variant='body1' color='primary'>
                    {translate(
                      translationKey('Description.CardInfo', TranslationNamespace.CloudServices),
                      {
                        cardType: savedPaymentInfo?.cardNetwork
                          ? savedPaymentInfo.cardNetwork.charAt(0).toUpperCase() +
                            savedPaymentInfo.cardNetwork.slice(1)
                          : '',
                        lastFourDigits: savedPaymentInfo?.last4Digits ?? '',
                      },
                    )}
                  </Typography>
                </Grid>
                <Grid item XSmall={6}>
                  <Typography variant='body1' color='primary'>
                    {savedPaymentInfo?.expMonth}/{savedPaymentInfo?.expYear}
                  </Typography>
                </Grid>
              </Grid>
              {name && (
                <React.Fragment>
                  <Grid container item XSmall={12} className={paymentDescription}>
                    <Typography variant='smallLabel1' color='secondary'>
                      {translate(
                        translationKey('Label.BillingAddress', TranslationNamespace.CloudServices),
                      )}
                    </Typography>
                  </Grid>
                  <Grid container item XSmall={12}>
                    <Typography variant='body1' color='primary'>
                      <Grid item XSmall={12}>
                        <Typography variant='body1'>{name}</Typography>
                      </Grid>
                      <Grid item XSmall={12}>
                        <Typography variant='body1'>{address?.line1}</Typography>
                      </Grid>
                      <Grid item XSmall={12}>
                        <Typography variant='body1'>
                          {address?.city}, {address?.state} {address?.postal_code}
                        </Typography>
                      </Grid>
                    </Typography>
                  </Grid>
                </React.Fragment>
              )}
            </Grid>
          </CardContent>
        </Card>
      </Grid>
      <Divider className={bottomDivider} />
      <Grid
        container
        item
        XSmall={12}
        justifyContent='flex-end'
        spacing={2}
        className={buttonContainer}>
        <Grid item>
          <Button color='primary' size='medium' variant='outlined' onClick={handleBackToPayment}>
            {translate(translationKey('Label.Back', TranslationNamespace.CloudServices))}
          </Button>
        </Grid>
        <Grid item>
          <Button
            color='primaryBrand'
            size='medium'
            onClick={() => {
              if (savedPaymentInfo && savedAccountInfo) {
                saveAllInformation(savedPaymentInfo, savedAccountInfo);
              }
            }}
            variant='contained'>
            {!confirmIsLoading ? (
              translate(translationKey('Label.SaveChanges', TranslationNamespace.CloudServices))
            ) : (
              <div>
                <CircularProgress size='15px' color='secondary' className={loadingProgress} />
                {translate(translationKey('Label.SaveChanges', TranslationNamespace.CloudServices))}
              </div>
            )}
          </Button>
        </Grid>
      </Grid>
    </>
  );
};

export default withTranslation(ReviewAndSave, [TranslationNamespace.CloudServices]);
