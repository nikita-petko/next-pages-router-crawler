import React, { FunctionComponent, useCallback, useEffect, useState, useMemo } from 'react';
import {
  AddIcon,
  Button,
  Card,
  Grid,
  Select,
  MenuItem,
  NavigateNextIcon,
  Typography,
  useDialog,
  Tooltip,
  InfoOutlinedIcon,
} from '@rbx/ui';
import { urls, CreatorType } from '@modules/miscellaneous/common';
import { Flex } from '@modules/miscellaneous/common/components';
import { getResponseFromError } from '@modules/clients/utils';
import CreatorDashboardLink from '@modules/miscellaneous/common/components/CreatorDashboardLink';
import { useRouter } from 'next/router';
import { getProductionCreatorHubUrl } from '@rbx/env-utils';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useTranslationWrapper, translationKey } from '@modules/analytics-translations';
import useBillingBalanceStyles from './BillingBalance.styles';
import { BalanceInfo, PaymentProfile } from '../../types';
import { currencyNumberFormatter } from '../../../utils/formatters';
import CloudPricingClientProvider, {
  useCloudPricingClient,
} from '../../CloudPricingClientProvider';
import useTopMessage from '../../../utils/useTopMessage';
import PaymentMethodIcons from '../PaymentMethodIcons/PaymentMethodIcons';
import StripeElementsProvider from '../StripeElementsProvider/StripeElementsProvider';

export type BillingBalanceProps = {
  balanceInfo: BalanceInfo;
  creatorType: CreatorType;
  id: number;
  userId: number;
  userIdOverride?: number;
  groupIdOverride?: number;
  displayMissingPaymentAlert: (hasDefault: boolean) => void;
  setLoading: (isLoading: boolean) => void;
};

export const BillingBalance: FunctionComponent<BillingBalanceProps> = ({
  balanceInfo,
  creatorType,
  id,
  userId,
  userIdOverride,
  groupIdOverride,
  displayMissingPaymentAlert,
  setLoading,
}) => {
  const {
    classes: {
      addMenuItem,
      sectionContainer,
      balanceContainer,
      costDivider,
      billingActivitiesContainer,
      cardNumberDropDown,
      descriptionText,
      viewDetailButton,
      paymentSelector,
      paymentDescription,
      paymentHeader,
      paymentContainer,
      infoToolTip,
    },
  } = useBillingBalanceStyles();
  const { outstandingBalance, chargingThreshold } = balanceInfo;
  const { query } = useRouter();
  const cloudPricingClient = useCloudPricingClient();
  const { showFailureMessage } = useTopMessage();
  const [paymentProfiles, setPaymentProfiles] = useState<PaymentProfile[] | null>(null);
  const [isPaymentProfilesNull, setIsPaymentProfileNull] = useState<boolean>(true);
  const [defaultPaymentProfile, setDefaultPaymentProfile] = useState<PaymentProfile | null>(null);
  const [selectedValue, setSelectedValue] = useState('default');
  const { translate, translateHTML } = useTranslationWrapper(useTranslation());
  const { open, close, configure } = useDialog();

  const setPaymentProfile = useCallback(
    async (value: string, paymentProfileId: string, paymentProfileOwnerType: string) => {
      setLoading(true);
      try {
        // Default payment method can be set on group or user level.
        await cloudPricingClient.setPaymentProfiles(
          creatorType,
          id,
          paymentProfileId,
          paymentProfileOwnerType,
        );
        setSelectedValue(value);
      } catch (error) {
        const errorMessage = getResponseFromError(error);
        if (errorMessage?.status === 403 || errorMessage?.status === 401) {
          showFailureMessage(
            translate(
              translationKey('Message.UnauthorizedUser', TranslationNamespace.CloudServices),
            ),
          );
        } else {
          showFailureMessage(
            translate(
              translationKey(
                'Message.PaymentProfileFailedToSave',
                TranslationNamespace.CloudServices,
              ),
            ),
          );
        }
      } finally {
        setLoading(false);
      }
    },
    [cloudPricingClient, creatorType, id, setLoading, showFailureMessage, translate],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps -- we need awaits for the client calls
  const getPaymentInfo = useCallback(
    async (setNewPaymentMethod: boolean) => {
      try {
        // Always list the payment profiles from the user
        const res = await cloudPricingClient.listPaymentProfiles(userId, userIdOverride);

        // Check if we have any payment profiles. If we do not then display alert to add payment methods
        if (!res.paymentProfiles || res.paymentProfiles?.length === 0) {
          displayMissingPaymentAlert(true);
        }

        // If this is true, it means we need to set the newly added payment method as the default
        if (setNewPaymentMethod && res.paymentProfiles != null) {
          const paymentCount = res.paymentProfiles.length - 1;
          if (
            res.paymentProfiles[paymentCount].paymentProfileId != null &&
            res.paymentProfiles[paymentCount].paymentProfileOwnerType != null
          ) {
            await setPaymentProfile(
              'default',
              res.paymentProfiles[paymentCount].paymentProfileId,
              res.paymentProfiles[paymentCount].paymentProfileOwnerType,
            );
          }
        }
        // We pull default payment method from group or user, depending on how the user is accessing
        const defaultRes = await cloudPricingClient.getPaymentProfiles(
          creatorType,
          id,
          userIdOverride,
          groupIdOverride,
        );

        // Check if we have a list of payment profiles so we can populate
        // The payment method drop down with the correct information
        if (res != null && res.paymentProfiles != null) {
          setPaymentProfiles(res.paymentProfiles);
          setIsPaymentProfileNull(false);
        } else {
          setIsPaymentProfileNull(true);
          displayMissingPaymentAlert(true);
        }
        setDefaultPaymentProfile(defaultRes);
      } catch {
        // If we aren't able to correctly get the payment profiles, we should set the state to default rather than failing
        // This is because the page is already loaded.
        setIsPaymentProfileNull(true);
        setPaymentProfiles(null);
        setDefaultPaymentProfile(null);
      }
    },
    [
      cloudPricingClient,
      setPaymentProfile,
      creatorType,
      id,
      userId,
      userIdOverride,
      groupIdOverride,
      displayMissingPaymentAlert,
    ],
  );

  // When Stripe is done, we will close the dialog and refresh the payment
  const handleStripeElementsProviderResponse = useCallback(async () => {
    close();
    getPaymentInfo(false);
  }, [close, getPaymentInfo]);

  const defaultMenuItem = isPaymentProfilesNull ? (
    <MenuItem disabled style={{ display: 'none' }} value='default'>
      {translate(
        translationKey('Label.NoPaymentOptionsAvailable', TranslationNamespace.CloudServices),
      )}
    </MenuItem>
  ) : (
    <MenuItem disabled style={{ display: 'none' }} value='default'>
      {translate(translationKey('Label.SelectAPaymentOption', TranslationNamespace.CloudServices))}
    </MenuItem>
  );

  // We can only add payment methods on the user Id level even if we're on the group page.
  // When we are on the group page we will be adding to the group owner's list of payment methods.
  const addPaymentMethodDialog = useMemo(() => {
    return (
      <CloudPricingClientProvider>
        <StripeElementsProvider
          setAsDefault={false}
          creatorId={userId}
          closeDialog={close}
          step={0}
          enableDialog
          confirmAddressAndCard={() => {}}
          handleStripeResponse={handleStripeElementsProviderResponse}
        />
      </CloudPricingClientProvider>
    );
  }, [close, userId, handleStripeElementsProviderResponse]);

  const handleAddPaymentMethodDialog = useCallback(() => {
    configure(addPaymentMethodDialog);
    open();
  }, [addPaymentMethodDialog, configure, open]);

  const handleChange = async (event: { target: { value: string } }) => {
    const { value } = event.target;
    if (value === 'add') {
      handleAddPaymentMethodDialog();
      return;
    }
    if (paymentProfiles != null) {
      const selectedPaymentProfile = paymentProfiles[+value];
      if (
        selectedPaymentProfile.paymentProfileId &&
        selectedPaymentProfile.paymentProfileOwnerType
      ) {
        await setPaymentProfile(
          value,
          selectedPaymentProfile.paymentProfileId,
          selectedPaymentProfile.paymentProfileOwnerType,
        );
      } else {
        showFailureMessage(
          translate(
            translationKey(
              'Message.PaymentProfileFailedToSave',
              TranslationNamespace.CloudServices,
            ),
          ),
        );
      }
    } else {
      showFailureMessage(
        translate(
          translationKey('Message.PaymentProfileFailedToSave', TranslationNamespace.CloudServices),
        ),
      );
    }
  };

  useEffect(() => {
    getPaymentInfo(false);
    setSelectedValue('default');
  }, [setSelectedValue, getPaymentInfo]);

  return (
    <Grid container XSmall={12} direction='row' spacing={2} className={billingActivitiesContainer}>
      {/* Left Card */}
      <Grid item container XSmall={6} className={paymentContainer}>
        <Card className={sectionContainer}>
          <Grid container item XSmall={12} direction='row' spacing={2}>
            <Grid item XSmall={12}>
              <Typography variant='captionHeader' color='secondary'>
                {translate(
                  translationKey('Heading.CostSummary', TranslationNamespace.CloudServices),
                )}
              </Typography>
            </Grid>
            <Grid container item XSmall={6}>
              <Grid item XSmall={12}>
                <Typography variant='captionHeader' color='secondary'>
                  {translate(
                    translationKey('Heading.PendingBalance', TranslationNamespace.CloudServices),
                  )}
                </Typography>
              </Grid>
              <div>
                <Typography variant='h2'>{currencyNumberFormatter(outstandingBalance)}</Typography>
                {outstandingBalance > 0 && (
                  <CreatorDashboardLink
                    href={{
                      pathname: urls.creatorHub.dashboard.getBillingStatementUrl('pending'),
                      query: {
                        ...(query.groupId ? { groupId: query.groupId } : {}),
                        ...(query.userIdOverride ? { userIdOverride: query.userIdOverride } : {}),
                        ...(query.groupIdOverride
                          ? { groupIdOverride: query.groupIdOverride }
                          : {}),
                      },
                    }}>
                    <Button size='small' color='secondary' className={viewDetailButton}>
                      {translate(
                        translationKey('Action.ViewDetails', TranslationNamespace.CloudServices),
                      )}
                      <NavigateNextIcon />
                    </Button>
                  </CreatorDashboardLink>
                )}
              </div>
            </Grid>
            <Grid item>
              <div className={costDivider} />
            </Grid>
            <Grid container alignItems='left' item XSmall={5}>
              <Grid item XSmall={12}>
                <Typography variant='captionHeader' color='secondary'>
                  {translate(
                    translationKey('Label.MonthToDateCost', TranslationNamespace.CloudServices),
                  )}
                </Typography>
              </Grid>
              <Grid item XSmall={12}>
                <Typography variant='h2'>
                  {currencyNumberFormatter(balanceInfo.monthToDateBalance)}
                </Typography>
                <Tooltip
                  title={translate(
                    translationKey(
                      'Description.MonthToDateCostTooltip',
                      TranslationNamespace.CloudServices,
                    ),
                  )}>
                  <InfoOutlinedIcon className={infoToolTip} />
                </Tooltip>
              </Grid>
            </Grid>
          </Grid>
          <Grid item XSmall={12}>
            <Typography
              variant='body2'
              color='secondary'
              component='div'
              className={descriptionText}>
              {translateHTML(
                translationKey('Description.PendingBalance', TranslationNamespace.CloudServices),
                [
                  {
                    opening: 'linkStart',
                    closing: 'linkEnd',
                    content(chunks) {
                      return (
                        <CreatorDashboardLink
                          href={`${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/cloud-services/extended-services`}
                          target='_blank'
                          underline='hover'>
                          {chunks}
                        </CreatorDashboardLink>
                      );
                    },
                  },
                ],
                {
                  chargingThreshold: currencyNumberFormatter(chargingThreshold),
                },
              )}
            </Typography>
          </Grid>
        </Card>
      </Grid>

      {/* Right Card */}
      <Grid item container XSmall={6}>
        <Card className={balanceContainer}>
          <Grid item XSmall={12} className={paymentHeader}>
            <Typography variant='captionHeader' color='secondary'>
              {translate(translationKey('Label.PaymentMethod', TranslationNamespace.CloudServices))}
            </Typography>
          </Grid>
          <Grid item XSmall={12}>
            <Select
              margin='none'
              onChange={handleChange}
              size='small'
              value={selectedValue}
              className={paymentSelector}>
              {!defaultPaymentProfile ? (
                defaultMenuItem
              ) : (
                <MenuItem
                  disabled
                  style={{ display: 'none' }}
                  value='default'
                  className={cardNumberDropDown}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ marginRight: '5px' }}>
                      <PaymentMethodIcons
                        paymentMethodType={
                          defaultPaymentProfile
                            ? defaultPaymentProfile.cardNetwork || 'default'
                            : 'default'
                        }
                        largeIcon={false}
                        smallIcon={false}
                      />
                    </div>
                    <span>{`****  ${defaultPaymentProfile.last4Digits}`}</span>
                  </div>
                </MenuItem>
              )}
              {paymentProfiles?.map((paymentProfile, index) => (
                <MenuItem
                  key={paymentProfile.paymentProfileId}
                  value={index}
                  className={cardNumberDropDown}>
                  <Flex flexDirection='row'>
                    <div style={{ marginRight: '5px' }}>
                      <PaymentMethodIcons
                        paymentMethodType={
                          paymentProfile ? paymentProfile.cardNetwork || 'default' : 'default'
                        }
                        largeIcon={false}
                        smallIcon={false}
                      />
                    </div>
                    <span>{`****  ${paymentProfile.last4Digits}`}</span>
                  </Flex>
                </MenuItem>
              ))}
              <MenuItem value='add'>
                <div className={addMenuItem}>
                  <AddIcon />{' '}
                  {translate(
                    translationKey('Label.AddNewCard', TranslationNamespace.CloudServices),
                  )}
                </div>
              </MenuItem>
            </Select>
            <Typography
              variant='body2'
              color='secondary'
              component='div'
              className={paymentDescription}>
              {translate(
                translationKey(
                  'Description.PaymentMethodAppliesToAllExperiences',
                  TranslationNamespace.CloudServices,
                ),
              )}
            </Typography>
            <Typography variant='body2' color='secondary' component='div'>
              {translate(
                translationKey(
                  'Description.MayTemporarilyHold',
                  TranslationNamespace.CloudServices,
                ),
              )}
            </Typography>
          </Grid>
        </Card>
      </Grid>
    </Grid>
  );
};

export default withTranslation(BillingBalance, [TranslationNamespace.CloudServices]);
