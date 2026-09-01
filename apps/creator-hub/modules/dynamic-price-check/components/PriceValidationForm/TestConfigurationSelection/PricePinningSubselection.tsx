import { memo, useCallback } from 'react';
import { useController } from 'react-hook-form';
import { useTranslation } from '@rbx/intl';
import {
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  RobuxIcon,
  FormHelperText,
  Card,
} from '@rbx/ui';
import { PINNED_PRICE_AMOUNTS } from '../constants';
import { priceValidationSchema } from '../schemas';
import type { PriceValidationFormValues } from '../types';
import useTestConfigurationSelectionStyles from './TestConfigurationSelection.styles';

type PricePinningSubselectionProps = {
  disabled?: boolean;
};

function PricePinningSubselection({ disabled }: PricePinningSubselectionProps) {
  const { translate } = useTranslation();
  const { classes } = useTestConfigurationSelectionStyles();

  const {
    field: { value, name, onChange },
  } = useController<PriceValidationFormValues, 'price'>({
    name: 'price',
    rules: priceValidationSchema.price,
  });

  const handlePriceRadioChange = useCallback(
    (_: React.ChangeEvent<HTMLInputElement>, v: string) => {
      onChange(Number(v));
    },
    [onChange],
  );

  return (
    <Card className={classes.subselection}>
      <Typography variant='h5' component='h4' color={disabled ? 'secondary' : 'primary'}>
        {translate('Heading.PricePinningSubselection')}
      </Typography>
      <Typography variant='body1' component='p' color={disabled ? 'disabled' : 'primary'}>
        {translate('Description.PricePinningSubselection')}
      </Typography>

      <RadioGroup name={name} value={value} onChange={handlePriceRadioChange}>
        {PINNED_PRICE_AMOUNTS.map((amount) => (
          <FormControlLabel
            key={`robux-${amount}`}
            value={amount}
            disabled={disabled}
            control={
              <Radio
                aria-label={translate('Label.RobuxAmount', { amount: amount.toString() })}
                color='secondary'
                className={classes.radio}
              />
            }
            disableTypography
            label={
              <span className={classes.priceRadioLabel}>
                <RobuxIcon aria-hidden color={disabled ? 'disabled' : 'action'} />
                <Typography
                  variant='body1'
                  component='span'
                  color={disabled ? 'disabled' : 'primary'}>
                  {amount}
                </Typography>
              </span>
            }
          />
        ))}
      </RadioGroup>
      <FormHelperText disabled={disabled}>{translate('Description.PriceOptions')}</FormHelperText>
    </Card>
  );
}

export default memo(PricePinningSubselection);
