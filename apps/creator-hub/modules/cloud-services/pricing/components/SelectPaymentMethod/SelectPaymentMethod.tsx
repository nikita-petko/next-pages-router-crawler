import React, { FunctionComponent, useCallback, useEffect, useState } from 'react';
import {
  AddIcon,
  Button,
  CircularProgress,
  Grid,
  Divider,
  ListSubheader,
  Select,
  MenuItem,
  Typography,
} from '@rbx/ui';
import { CreatorType } from '@modules/miscellaneous/common';
import { useTranslation, withTranslation } from '@rbx/intl';
import { useTranslationWrapper, translationKey } from '@modules/analytics-translations';
import TranslationNamespace from '@modules/miscellaneous/localization/enums/TranslationNamespace';
import CloudPricingClientProvider, {
  useCloudPricingClient,
} from '../../CloudPricingClientProvider';
import StripeElementsProvider from '../StripeElementsProvider/StripeElementsProvider';
import useSelectPaymentMethodStyles from './SelectPaymentMethod.styles';
import { PaymentProfile } from '../../types';
import PaymentMethodIcons from '../PaymentMethodIcons/PaymentMethodIcons';
import { CardVerificationResultEnum } from '../shared/stripeConstants';

export interface SelectPaymentMethodProps {
  creatorType: CreatorType;
  creatorId: number;
  userId: number;
  nextStepper: (profile: PaymentProfile) => void;
  closeDialog: () => void;
  saveStatus: (clientResponse: CardVerificationResultEnum, setDefault: boolean) => void;
  step?: number;
  userIdOverride?: number;
  groupIdOverride?: number;
}
const SelectPaymentMethod: FunctionComponent<SelectPaymentMethodProps> = ({
  creatorType,
  creatorId,
  userId,
  nextStepper,
  closeDialog,
  saveStatus,
  step,
  userIdOverride,
  groupIdOverride,
}) => {
  const {
    classes: {
      bottomDivider,
      cancelButton,
      buttonContainer,
      saveButton,
      savePaymentWarningDescription,
      cardNumberDropDown,
      paymentSelector,
      listSubheaderLabel,
      menuItems,
      paymentIcons,
      paymentContainer,
      circularSpace,
    },
  } = useSelectPaymentMethodStyles();
  const [paymentProfiles, setPaymentProfiles] = useState<PaymentProfile[] | null>(null);
  const [isPaymentProfilesNull, setIsPaymentProfileNull] = useState<boolean>(true);
  const [defaultPaymentProfile, setDefaultPaymentProfile] = useState<PaymentProfile | null>(null);
  const cloudPricingClient = useCloudPricingClient();
  const [selectedValue, setSelectedValue] = useState('default');
  const [openDialog, setOpenDialog] = useState(false);
  const [isFormInvalid, setIsFormInvalid] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { translate } = useTranslationWrapper(useTranslation());

  const defaultMenuItem = isPaymentProfilesNull ? (
    <MenuItem disabled className={menuItems} value='default'>
      {translate(
        translationKey('Label.NoPaymentOptionsAvailable', TranslationNamespace.CloudServices),
      )}
    </MenuItem>
  ) : (
    <MenuItem disabled className={menuItems} value='default'>
      {translate(translationKey('Label.SelectAPaymentOption', TranslationNamespace.CloudServices))}
    </MenuItem>
  );

  const getPaymentInfo = useCallback(async () => {
    try {
      // We only display user level payment methods.
      // However a group owner can authorize the group to use the user level payment methods.
      // That means we can have a separate default payment method for the group which is what
      // We are pulling below.
      const res = await cloudPricingClient.listPaymentProfiles(userId, userIdOverride);
      if (res != null && res.paymentProfiles != null) {
        setPaymentProfiles(res.paymentProfiles);
        setIsPaymentProfileNull(false);
      } else {
        setIsPaymentProfileNull(true);
      }

      const defaultRes = await cloudPricingClient.getPaymentProfiles(
        creatorType,
        creatorId,
        userIdOverride,
        groupIdOverride,
      );
      setDefaultPaymentProfile(defaultRes);
    } catch {
      setIsPaymentProfileNull(true);
      setPaymentProfiles(null);
      setDefaultPaymentProfile(null);
    }
  }, [cloudPricingClient, creatorType, creatorId, userId, userIdOverride, groupIdOverride]);

  const setPaymentProfile = useCallback(
    async (paymentProfileId: string, paymentProfileOwnerType: string) => {
      setIsLoading(true);
      try {
        // Set the payment profile for the group, this is authorizing the group to use the user's payment profile.
        await cloudPricingClient.setPaymentProfiles(
          creatorType,
          creatorId,
          paymentProfileId,
          paymentProfileOwnerType,
        );
        saveStatus(CardVerificationResultEnum.SUCCESS, false);
      } catch {
        saveStatus(CardVerificationResultEnum.CARD_AUTHENTICATION_FAILED, false);
      } finally {
        setIsLoading(false);
      }
    },
    [cloudPricingClient, creatorType, creatorId, saveStatus],
  );

  const handleChange = (event: { target: { value: string } }) => {
    const { value } = event.target;
    if (value === 'new') {
      setOpenDialog(true);
    } else {
      setSelectedValue(value);
      setIsFormInvalid(false);
    }
  };

  const handleSave = useCallback(async () => {
    // If we're in a step, we need to go to the next step for confirmation before saving.
    if (step === 1 && paymentProfiles != null && typeof selectedValue === 'number') {
      nextStepper(paymentProfiles[selectedValue]);
    } else if (paymentProfiles != null && typeof selectedValue === 'number' && !step) {
      const selectedPaymentProfile = paymentProfiles[selectedValue];
      if (
        selectedPaymentProfile.paymentProfileId &&
        selectedPaymentProfile.paymentProfileOwnerType
      ) {
        await setPaymentProfile(
          selectedPaymentProfile.paymentProfileId,
          selectedPaymentProfile.paymentProfileOwnerType,
        );
        closeDialog();
      } else {
        saveStatus(CardVerificationResultEnum.CARD_AUTHENTICATION_FAILED, false);
        closeDialog();
      }
    } else {
      saveStatus(CardVerificationResultEnum.CARD_AUTHENTICATION_FAILED, false);
      closeDialog();
    }
  }, [
    paymentProfiles,
    selectedValue,
    step,
    nextStepper,
    setPaymentProfile,
    saveStatus,
    closeDialog,
  ]);

  useEffect(() => {
    if (creatorType && creatorId && userId) {
      getPaymentInfo();
    } else {
      setIsPaymentProfileNull(true);
      setPaymentProfiles(null);
      setDefaultPaymentProfile(null);
    }
  }, [
    creatorType,
    creatorId,
    userId,
    setIsPaymentProfileNull,
    setPaymentProfiles,
    setDefaultPaymentProfile,
    getPaymentInfo,
  ]);

  return (
    <div>
      {!openDialog && (
        <div>
          <Select
            classes={{
              root: 'css-15jlliu-select',
            }}
            helperText={translate(
              translationKey(
                'Description.PaymentMethodAppliesToAllExperiences',
                TranslationNamespace.CloudServices,
              ),
            )}
            label={translate(
              translationKey('Label.PaymentMethodSelector', TranslationNamespace.CloudServices),
            )}
            margin='none'
            onChange={handleChange}
            size='medium'
            value={selectedValue}
            className={paymentSelector}>
            {!defaultPaymentProfile ? (
              defaultMenuItem
            ) : (
              <MenuItem value='default' className={cardNumberDropDown}>
                <div className={paymentIcons}>
                  <div className={paymentContainer}>
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

            <ListSubheader className={listSubheaderLabel}>
              {creatorType === CreatorType.User
                ? translate(
                    translationKey(
                      'Label.UserOwnedPaymentMethods',
                      TranslationNamespace.CloudServices,
                    ),
                  )
                : translate(
                    translationKey(
                      'Label.GroupOwnedPaymentMethods',
                      TranslationNamespace.CloudServices,
                    ),
                  )}
            </ListSubheader>
            {paymentProfiles?.map((paymentProfile, index) => (
              <MenuItem key={paymentProfile.paymentProfileId} value={index}>
                <div className={paymentIcons}>
                  <div className={paymentContainer}>
                    <PaymentMethodIcons
                      paymentMethodType={
                        paymentProfile ? paymentProfile.cardNetwork || 'default' : 'default'
                      }
                      largeIcon={false}
                      smallIcon={false}
                    />
                  </div>
                  <span>{`****  ${paymentProfile.last4Digits}`}</span>
                </div>
              </MenuItem>
            ))}
            <MenuItem value='new'>
              <AddIcon />
              {translate(translationKey('Label.AddNewCard', TranslationNamespace.CloudServices))}
            </MenuItem>
          </Select>
          <Typography variant='body2' color='secondary' className={savePaymentWarningDescription}>
            {translate(
              translationKey(
                'Description.SavePaymentMethodWarning',
                TranslationNamespace.CloudServices,
              ),
            )}
          </Typography>
          <Divider className={bottomDivider} />
          <Grid
            container
            item
            XSmall={12}
            justifyContent='flex-end'
            spacing={2}
            className={buttonContainer}>
            <Grid item>
              <Button
                className={cancelButton}
                color='primary'
                size='medium'
                variant='outlined'
                onClick={closeDialog}>
                {step === 1
                  ? translate(translationKey('Label.Back', TranslationNamespace.CloudServices))
                  : translate(translationKey('Label.Cancel', TranslationNamespace.CloudServices))}
              </Button>
            </Grid>
            <Grid item>
              <Button
                className={saveButton}
                color='primaryBrand'
                size='medium'
                variant='contained'
                onClick={handleSave}
                disabled={isFormInvalid}>
                {!isLoading ? (
                  translate(
                    translationKey(
                      step === undefined ? 'Label.SaveChanges' : 'Label.NextStepper',
                      TranslationNamespace.CloudServices,
                    ),
                  )
                ) : (
                  <div>
                    <CircularProgress size='15px' color='secondary' className={circularSpace} />
                    {translate(
                      translationKey(
                        step === undefined ? 'Label.SaveChanges' : 'Label.NextStepper',
                        TranslationNamespace.CloudServices,
                      ),
                    )}
                  </div>
                )}
              </Button>
            </Grid>
          </Grid>
        </div>
      )}
      {openDialog && (
        <CloudPricingClientProvider>
          <StripeElementsProvider
            creatorId={userId}
            setAsDefault={false}
            confirmAddressAndCard={() => {}}
            enableDialog={false}
            closeDialog={() => setOpenDialog(false)}
            step={0}
            handleStripeResponse={() => {
              getPaymentInfo();
              setOpenDialog(false);
            }}
          />
        </CloudPricingClientProvider>
      )}
    </div>
  );
};

export default withTranslation(SelectPaymentMethod, [TranslationNamespace.CloudServices]);
