import { useCallback, useMemo } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { clsx } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { Grid, InputAdornment, RobuxIcon, TextField, Typography } from '@rbx/ui';
import {
  MaximumRobuxPriceForPlaceSales,
  MinimumRobuxPriceForPlaceSales,
  PrivateServerMaxPrice,
  PrivateServerMinPrice,
  PrivateServerPriceChangeCooldownDays,
  PrivateServerRegionalPricingMinPrice,
} from '../constants/AccessConstants';
import type { ExperienceAccessFormType } from '../ExperienceAccessTypes';
import useExperienceAccessPaymentFormStyles from './ExperienceAccessPayment.styles';
import PrivateServerRegionalPricesDisplay from './PrivateServerRegionalPricesDisplay';

export const ExperienceAccessRegisterOptions = {
  price: {
    min: MinimumRobuxPriceForPlaceSales,
    max: {
      value: MaximumRobuxPriceForPlaceSales,
      message: 'Error.PaymentMaxValue',
    },
    pattern: {
      value: /^\d+$/,
      message: 'Error.InvalidNumber',
    },
    required: 'Error.Required',
  },
  privateServerPrice: {
    min: PrivateServerMinPrice,
    max: {
      value: PrivateServerMaxPrice,
      message: 'Error.PaymentMaxValue',
    },
    pattern: {
      value: /^\d+$/,
      message: 'Error.InvalidNumber',
    },
    required: 'Error.Required',
  },
  fiatBasePriceId: {
    required: 'Error.Required',
  },
};

type Props = {
  commissionRate: number;
  fieldName: 'privateServerPrice' | 'price';
  isFiatPaidAccessEnabled: boolean;
  universeId: number;
};

function ExperienceAccessPayment({
  commissionRate,
  fieldName,
  isFiatPaidAccessEnabled,
  universeId,
}: Props) {
  const {
    classes: { background, textField, marketFeeTypography, earningFeeTypography },
  } = useExperienceAccessPaymentFormStyles();
  const { translate } = useTranslation();
  const { control, formState, getValues } = useFormContext<ExperienceAccessFormType>();
  const { errors } = formState;

  const isPrivateServer = fieldName === 'privateServerPrice';
  const showRegionalPricing = isPrivateServer;

  const minimumPrice = useMemo(() => {
    if (!isPrivateServer) {
      return MinimumRobuxPriceForPlaceSales;
    }
    return showRegionalPricing ? PrivateServerRegionalPricingMinPrice : PrivateServerMinPrice;
  }, [isPrivateServer, showRegionalPricing]);

  const getMarketPlaceFee = useCallback(
    (inputPrice: number) => {
      return Math.floor((inputPrice * commissionRate) / 100);
    },
    [commissionRate],
  );

  const getEarningFee = useCallback(
    (inputPrice: number) => {
      return inputPrice - Math.floor((inputPrice * commissionRate) / 100);
    },
    [commissionRate],
  );

  const getHelperText = useCallback(() => {
    if (fieldName === 'price' && errors.price && errors.price.message) {
      return errors.price.type === 'max'
        ? translate(errors.price.message, { maxValue: MaximumRobuxPriceForPlaceSales.toString() })
        : translate(errors.price.message);
    }
    if (
      fieldName === 'privateServerPrice' &&
      errors.privateServerPrice &&
      errors.privateServerPrice.message
    ) {
      return errors.privateServerPrice.type === 'max'
        ? translate(errors.privateServerPrice.message, {
            maxValue: PrivateServerMaxPrice.toString(),
          })
        : translate(errors.privateServerPrice.message);
    }
    if (isPrivateServer) {
      return translate('Message.MinimumRobuxPrivateServerChangeWarning', {
        robuxNum: minimumPrice.toString(),
        minDaysNum: PrivateServerPriceChangeCooldownDays.toString(),
      });
    }
    return translate('Message.MinimunRobux', {
      robuxNum: minimumPrice.toString(),
    });
  }, [errors, translate, fieldName, minimumPrice, isPrivateServer]);

  const containerWidth = useMemo(() => {
    if (showRegionalPricing) {
      return 4;
    }
    if (isFiatPaidAccessEnabled) {
      return 6;
    }
    return 3;
  }, [showRegionalPricing, isFiatPaidAccessEnabled]);

  return (
    <Grid item container XSmall={12}>
      <Grid container classes={{ root: background }} XLarge={containerWidth}>
        {showRegionalPricing && (
          <div className='padding-x-large padding-top-large padding-left-xxlarge'>
            <span className='text-label-large content-default'>
              {translate('Label.DefaultPrice')}
            </span>
          </div>
        )}
        <Grid
          item
          XSmall={12}
          className={clsx(textField, showRegionalPricing && 'padding-bottom-xsmall')}>
          <Controller
            name={fieldName}
            control={control}
            rules={{
              ...ExperienceAccessRegisterOptions[fieldName],
              min: minimumPrice,
            }}
            render={({ field }) =>
              showRegionalPricing ? (
                <TextField
                  {...field}
                  error={!!errors[fieldName]}
                  fullWidth
                  id={fieldName}
                  inputMode='numeric'
                  label={translate('Label.RobuxPrice')}
                  helperText={getHelperText()}
                  FormHelperTextProps={{ className: 'text-caption-small' }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>
                        <RobuxIcon fontSize='small' />
                      </InputAdornment>
                    ),
                  }}
                />
              ) : (
                <TextField
                  {...field}
                  error={!!errors[fieldName]}
                  fullWidth
                  multiline
                  id={fieldName}
                  label={translate('Label.RobuxPrice')}
                  helperText={getHelperText()}
                />
              )
            }
          />
        </Grid>

        {showRegionalPricing ? (
          <PrivateServerRegionalPricesDisplay universeId={universeId} minimumPrice={minimumPrice} />
        ) : (
          <>
            <Grid item XSmall={12} classes={{ root: marketFeeTypography }}>
              <Typography variant='largeLabel1'>
                {translate('Message.MarketPlaceFee', {
                  percentage: `${commissionRate}%`,
                })}
              </Typography>
              <Typography>
                {translate('Message.RobuxNumber', {
                  robuxNum: `${getMarketPlaceFee(getValues(fieldName) ?? 0)}`,
                })}
              </Typography>
            </Grid>

            <Grid item XSmall={12} classes={{ root: earningFeeTypography }}>
              <Typography variant='largeLabel1'>{translate('Message.EarningFee')}</Typography>
              <Typography>
                {translate('Message.RobuxNumber', {
                  robuxNum: `${getEarningFee(getValues(fieldName) ?? 0)}`,
                })}
              </Typography>
            </Grid>
          </>
        )}
      </Grid>
    </Grid>
  );
}

export default ExperienceAccessPayment;
