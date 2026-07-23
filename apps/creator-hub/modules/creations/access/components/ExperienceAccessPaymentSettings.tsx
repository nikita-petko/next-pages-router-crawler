import { useCallback } from 'react';
import type { Control, ControllerRenderProps } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import type { RobloxPaidAccessFiatPaidAccessServiceV1BasePrice } from '@rbx/client-fiat-paid-access-service/v1';
import { useTranslation } from '@rbx/intl';
import {
  FormControlLabel,
  FormHelperText,
  Grid,
  InfoOutlinedIcon,
  Link,
  Radio,
  RadioGroup,
  Switch,
  Tooltip,
  Typography,
} from '@rbx/ui';
import { useGetConfiguredPrice } from '@modules/react-query/fiatPaidAccess/fiatPaidAccessQueries';
import { FIAT_PAID_ACCESS_LEARN_MORE_URL } from '../constants/AccessConstants';
import type { ExperienceAccessFormType } from '../ExperienceAccessTypes';
import useFormatters from '../hooks/useFormatter';
import useExperienceAccessFormStyles from './ExperienceAccessForm.styles';
import { ExperienceAccessRegisterOptions } from './ExperienceAccessPayment';

type Props = {
  control: Control<ExperienceAccessFormType>;
  disabled: boolean;
  showDemoModeToggle?: boolean;
  isDemoModeCooldownActive?: boolean;
  isGroupOwner?: boolean;
};

function ExperienceAccessPaymentSettings({
  control,
  disabled,
  showDemoModeToggle = false,
  isDemoModeCooldownActive = false,
  isGroupOwner,
}: Props) {
  const { translate, translateHTML } = useTranslation();
  const { formatPrice } = useFormatters();
  const {
    classes: {
      paymentSettingsContainer,
      paymentSelectionLabel,
      paymentSelectionContainer,
      infoIcon,
      tooltip,
      title,
    },
  } = useExperienceAccessFormStyles();
  const { data: priceData } = useGetConfiguredPrice();

  const handleFiatPriceOnchange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, fieldOnChange: ControllerRenderProps['onChange']) => {
      fieldOnChange(e.target.value);
    },
    [],
  );

  return (
    !!priceData?.prices && (
      <Grid item container classes={{ root: paymentSettingsContainer }} gap={2} XSmall={10}>
        <Grid direction='column' container item XSmall={12}>
          <Typography className={title} variant='h5'>
            {translate('Label.PaymentSettings')}
          </Typography>
          <Typography variant='body2' color='secondary'>
            {translate('Description.PaymentSettingsDesktopOnly')}
          </Typography>
        </Grid>
        <Grid item XSmall={12}>
          <Typography variant='body1' color='secondary'>
            {translate('Label.CurrencyAmount')}
          </Typography>
          <Tooltip
            title={
              <Typography variant='body2' className={tooltip}>
                {translate('Description.CurrencyAmount')}&nbsp;
                <Link
                  aria-label={translate('Label.LearnMore')}
                  href={FIAT_PAID_ACCESS_LEARN_MORE_URL}
                  target='_blank'>
                  {translate('Label.LearnMore')}
                </Link>
              </Typography>
            }
            placement='right'
            arrow>
            <InfoOutlinedIcon className={infoIcon} />
          </Tooltip>

          <Controller
            name='fiatBasePriceId'
            control={control}
            rules={ExperienceAccessRegisterOptions.fiatBasePriceId}
            render={({ field }) => (
              <RadioGroup
                {...field}
                onChange={(e) => handleFiatPriceOnchange(e, field.onChange)}
                value={field.value}
                id='currencyAmount'>
                {priceData?.prices?.map(
                  (price: RobloxPaidAccessFiatPaidAccessServiceV1BasePrice) => (
                    <FormControlLabel
                      value={price.id}
                      key={price.id}
                      control={<Radio disabled={disabled} aria-label={formatPrice(price.amount)} />}
                      classes={{ root: paymentSelectionContainer }}
                      label={
                        <Grid container direction='column' className={paymentSelectionLabel}>
                          <Typography variant='body1'>{formatPrice(price.amount)}</Typography>
                          <FormHelperText>
                            {translate('Label.RevenueShare')} ({price.payoutPercentage}%);{' '}
                            {formatPrice(price.payoutAmount)} {translate('Label.PerSale')}
                          </FormHelperText>
                        </Grid>
                      }
                    />
                  ),
                )}
              </RadioGroup>
            )}
          />
        </Grid>
        {showDemoModeToggle && (
          <Grid item XSmall={12}>
            <Controller
              name='demoModeEnabled'
              control={control}
              shouldUnregister={false}
              render={({ field: demoField }) => (
                <FormControlLabel
                  control={
                    <Switch
                      id='demo-mode-toggle-fiat'
                      aria-label={translate('Label.EnableDemoMode')}
                      onChange={(e) => demoField.onChange(e.target.checked)}
                      checked={demoField.value ?? false}
                      disabled={isGroupOwner === false || isDemoModeCooldownActive}
                    />
                  }
                  label={
                    <Grid container direction='column'>
                      <Typography variant='body1'>{translate('Label.EnableDemoMode')}</Typography>
                      <FormHelperText>
                        {isDemoModeCooldownActive
                          ? translate('Message.DemoModeCooldown')
                          : translateHTML('Description.EnableDemoMode', [
                              {
                                opening: 'linkStart',
                                closing: 'linkEnd',
                                content(chunks) {
                                  return (
                                    <Link
                                      href={`${FIAT_PAID_ACCESS_LEARN_MORE_URL}#demo-mode`}
                                      target='_blank'
                                      underline='always'>
                                      {chunks}
                                    </Link>
                                  );
                                },
                              },
                            ])}
                      </FormHelperText>
                    </Grid>
                  }
                />
              )}
            />
          </Grid>
        )}
      </Grid>
    )
  );
}

export default ExperienceAccessPaymentSettings;
