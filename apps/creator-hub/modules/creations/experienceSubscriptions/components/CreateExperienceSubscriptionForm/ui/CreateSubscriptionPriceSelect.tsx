import { useMemo } from 'react';
import { Control, Controller, FieldErrors, useWatch } from 'react-hook-form';
import { Grid, Select, MenuItem, Typography } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { Money } from '@rbx/clients/developerSubscriptionsApi';
import {
  CreateSubscriptionRegisterOptions,
  CreateSubscriptionFormType,
} from '../../../constants/CreateSubscriptionRegisterConstants';
import showMenuBelowSelector from '../../../utils/styles';

export type TCreateSubscriptionPriceSelectProps = {
  control: Control<CreateSubscriptionFormType>;
  errors: FieldErrors<CreateSubscriptionFormType>;
  priceTierMap?: Record<string, Money>;
  onPriceSelect: (priceTierKey: string) => void;
  existingBasePriceId?: string | null;
  disabled?: boolean;
};

function CreateSubscriptionPriceSelect({
  control,
  errors,
  priceTierMap,
  onPriceSelect,
  existingBasePriceId,
  disabled = false,
}: TCreateSubscriptionPriceSelectProps) {
  const { translate } = useTranslation();
  const currencyType = useWatch({ control, name: 'currencyType' });

  // Only require price when currencyType is 'fiat'
  const priceRules = useMemo(
    () => ({
      ...CreateSubscriptionRegisterOptions.price,
      required: currencyType === 'fiat' ? CreateSubscriptionRegisterOptions.price.required : false,
    }),
    [currencyType],
  );

  return (
    <Grid item XSmall={12}>
      <Controller
        name='price'
        control={control}
        defaultValue={existingBasePriceId ?? ''}
        rules={priceRules}
        render={({ field }) => (
          <Select
            {...field}
            fullWidth
            disabled={disabled}
            error={!!errors.price}
            id='price'
            label={translate('Label.Price')}
            required={currencyType === 'fiat'}
            SelectProps={{ ...showMenuBelowSelector }}>
            {priceTierMap &&
              Object.keys(priceTierMap).map((key) => {
                const values = priceTierMap[key];
                return (
                  <MenuItem key={key} value={key} onClick={() => onPriceSelect(key)}>
                    <Typography>
                      ${values.units}.{values.cents}
                    </Typography>
                  </MenuItem>
                );
              })}
          </Select>
        )}
      />
    </Grid>
  );
}

export default CreateSubscriptionPriceSelect;
