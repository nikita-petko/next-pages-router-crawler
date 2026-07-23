import { useState } from 'react';
import type { ControllerRenderProps } from 'react-hook-form';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from '@rbx/intl';
import {
  Typography,
  Grid,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormHelperText,
  Link,
  Alert,
  AlertTitle,
  Button,
  OpenInNewIcon,
} from '@rbx/ui';
import { FiatProductModerationStatus } from '@modules/clients/develop';
import FiatPaidAccessChecks from '@modules/fiat-paid-access/components/PaidAccessChecks/PaidAccessChecks';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import { FIAT_PAID_ACCESS_LEARN_MORE_URL } from '../constants/AccessConstants';
import type {
  ExperienceAccessFormType,
  UniverseAccessConfiguration,
} from '../ExperienceAccessTypes';
import { PaymentType } from '../ExperienceAccessTypes';
import useExperienceAccessFormStyles from './ExperienceAccessForm.styles';
import ExperienceAccessPayment from './ExperienceAccessPayment';
import ExperienceAccessPaymentSettings from './ExperienceAccessPaymentSettings';

type Props = {
  handlePaymentTypeChange: (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldOnChange: ControllerRenderProps['onChange'],
  ) => void;
  isAccessPublic: boolean;
  currentPaymentType: PaymentType;
  experienceMarketPlaceCommissionRate: number;
  currentIsPrivateServersAllowedValue: boolean;
  isGroupOwner?: boolean;
  universeAccessConfiguration: UniverseAccessConfiguration;
  // When true, Robux/Fiat payment options are disabled because the experience
  // audience is not Public.
  isAudienceNonPublicLocked?: boolean;
};

function ExperienceAccessPaymentType({
  handlePaymentTypeChange,
  isAccessPublic,
  currentPaymentType,
  experienceMarketPlaceCommissionRate,
  currentIsPrivateServersAllowedValue,
  isGroupOwner,
  universeAccessConfiguration,
  isAudienceNonPublicLocked = false,
}: Props) {
  const { translate } = useTranslation();
  const {
    classes: {
      switchStyle,
      paymentSelectionLabel,
      paymentSelectionContainer,
      title,
      paymentSettingsCard,
    },
  } = useExperienceAccessFormStyles();
  const [isEligibleForFiatPaidAccess, setIsEligibleForFiatPaidAccess] = useState<boolean>(false);
  const { control, formState } = useFormContext<ExperienceAccessFormType>();
  const { settings, isFetched: isSettingsFetched } = useSettings();
  const showDemoModeToggle = isSettingsFetched && settings.enableDemoMode;

  const [renderTime] = useState(() => Date.now());
  const changeableAfter = universeAccessConfiguration.demoModeChangeableAfter;
  const isDemoModeCooldownActive =
    formState.isSubmitSuccessful ||
    (changeableAfter != null && new Date(changeableAfter).getTime() > renderTime);

  const isFiatProductModerationRequested =
    !!universeAccessConfiguration.fiatProductModerationStatus &&
    universeAccessConfiguration.fiatProductModerationStatus !==
      FiatProductModerationStatus.NotModerated &&
    universeAccessConfiguration.fiatProductModerationStatus !==
      FiatProductModerationStatus.Rejected;
  const isPaymentSettingsSelectionDisabled =
    isGroupOwner === false ||
    universeAccessConfiguration.fiatProductModerationStatus === FiatProductModerationStatus.Pending;
  const isPaymentTypeSelectionDisabled = isGroupOwner === false && isFiatProductModerationRequested;
  const showPaymentSettings = isEligibleForFiatPaidAccess || isFiatProductModerationRequested;
  const showEligibilityChecks =
    !universeAccessConfiguration.isForSaleInFiat &&
    !isEligibleForFiatPaidAccess &&
    isGroupOwner !== false;
  const showGroupPermissionAlert =
    isGroupOwner === false &&
    (universeAccessConfiguration.fiatProductModerationStatus ===
      FiatProductModerationStatus.NotModerated ||
      universeAccessConfiguration.fiatProductModerationStatus ===
        FiatProductModerationStatus.Rejected);

  return (
    <Grid item XSmall={12} classes={{ root: switchStyle }}>
      <Controller
        name='paymentType'
        control={control}
        render={({ field }) => (
          <RadioGroup
            {...field}
            value={field.value}
            id='paymentType'
            onChange={(e) => handlePaymentTypeChange(e, field.onChange)}>
            <FormControlLabel
              value='free'
              control={
                <Radio
                  aria-label={translate('Label.FreeToPlay')}
                  disabled={isPaymentTypeSelectionDisabled}
                />
              }
              classes={{ root: paymentSelectionContainer }}
              label={
                <Grid container direction='column' className={paymentSelectionLabel}>
                  <Typography variant='body1'>{translate('Label.FreeToPlay')}</Typography>
                  <FormHelperText>{translate('Description.FreeToPlay')}</FormHelperText>
                </Grid>
              }
            />
            <FormControlLabel
              value='robux'
              control={
                <Radio
                  aria-label={translate('Label.RequiresRobux')}
                  disabled={
                    isPaymentTypeSelectionDisabled ||
                    !isAccessPublic ||
                    currentIsPrivateServersAllowedValue ||
                    isAudienceNonPublicLocked
                  }
                />
              }
              classes={{ root: paymentSelectionContainer }}
              label={
                <Grid container direction='column' className={paymentSelectionLabel}>
                  <Typography variant='body1'>{translate('Label.RequiresRobux')}</Typography>
                  <FormHelperText>
                    <span>{translate('Description.RequiresRobux')}</span>
                    <br />
                    <span>{translate('Message.PaymentInfo')}</span>
                  </FormHelperText>
                  {isAccessPublic && currentPaymentType === PaymentType.Robux && (
                    <ExperienceAccessPayment
                      commissionRate={experienceMarketPlaceCommissionRate}
                      fieldName='price'
                      isFiatPaidAccessEnabled
                      universeId={universeAccessConfiguration.id}
                    />
                  )}
                </Grid>
              }
            />
            <FormControlLabel
              value='fiat'
              control={
                <Radio
                  aria-label={translate('Label.RequiresLocalCurrency')}
                  disabled={
                    isPaymentTypeSelectionDisabled ||
                    !isAccessPublic ||
                    currentIsPrivateServersAllowedValue ||
                    isAudienceNonPublicLocked
                  }
                />
              }
              className={paymentSelectionContainer}
              label={
                <Grid container gap={2} alignContent='flex-start' className={paymentSelectionLabel}>
                  <Grid item XSmall={12}>
                    <Typography variant='body1'>
                      {translate('Label.RequiresLocalCurrency')}
                    </Typography>
                    <FormHelperText>
                      <span>
                        {translate('Description.RequiresLocalCurrencyPayment')}
                        &nbsp;
                      </span>
                      <Link
                        aria-label={translate('Label.LearnMore')}
                        href={FIAT_PAID_ACCESS_LEARN_MORE_URL}
                        target='_blank'>
                        {translate('Label.LearnMore')}
                      </Link>
                      <br />
                      <span>{translate('Description.RequiresLocalCurrencyAccess')}</span>
                    </FormHelperText>
                  </Grid>
                  {currentPaymentType === PaymentType.Fiat && showGroupPermissionAlert && (
                    <>
                      <Grid item XSmall={10}>
                        <Alert severity='warning' variant='standard'>
                          <AlertTitle className={title}>
                            {translate('Label.PermissionNotAllowed')}
                          </AlertTitle>
                          <span>{translate('Description.PermissionNotAllowedView')}</span>
                        </Alert>
                      </Grid>
                      <Grid
                        container
                        XSmall={10}
                        direction='column'
                        gap={0.5}
                        className={paymentSettingsCard}
                        item>
                        <Typography className={title} variant='h5'>
                          {translate('Label.PaymentSettings')}
                        </Typography>
                        <Typography variant='body2' color='secondary'>
                          {translate('Description.PaymentSettings')}
                        </Typography>
                      </Grid>
                    </>
                  )}
                  {currentPaymentType === PaymentType.Fiat && showPaymentSettings && (
                    <ExperienceAccessPaymentSettings
                      disabled={isPaymentSettingsSelectionDisabled}
                      control={control}
                      showDemoModeToggle={showDemoModeToggle}
                      isDemoModeCooldownActive={isDemoModeCooldownActive}
                      isGroupOwner={isGroupOwner}
                    />
                  )}
                  {currentPaymentType === PaymentType.Fiat && showEligibilityChecks && (
                    <Grid container item XSmall={10} gap={2}>
                      <Alert
                        severity='info'
                        variant='outlined'
                        action={
                          <Button
                            sx={{ whiteSpace: 'nowrap' }}
                            onClick={() => window.open(FIAT_PAID_ACCESS_LEARN_MORE_URL, '_blank')}
                            endIcon={<OpenInNewIcon />}>
                            {translate('Action.LearnMoreLinkText')}
                          </Button>
                        }>
                        <Grid container direction='column'>
                          <Typography variant='h6' color='inherit'>
                            {translate('Label.PaymentInfoRequired')}
                          </Typography>
                          <Typography variant='body2'>
                            {' '}
                            {translate('Description.PaymentInfoRequired')}
                          </Typography>
                        </Grid>
                      </Alert>
                      <FiatPaidAccessChecks
                        isCardComponent
                        setIsEligible={setIsEligibleForFiatPaidAccess}
                      />
                    </Grid>
                  )}
                </Grid>
              }
            />
          </RadioGroup>
        )}
      />
    </Grid>
  );
}

export default ExperienceAccessPaymentType;
