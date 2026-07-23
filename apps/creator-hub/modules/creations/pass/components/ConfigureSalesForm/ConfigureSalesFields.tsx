import { memo } from 'react';
import { useTranslation } from '@rbx/intl';
import { UseFormRegister, useFormState, useWatch } from 'react-hook-form';
import { useIsFetching } from '@tanstack/react-query';
import { CircularProgress, InputAdornment, RobuxIcon, TextField } from '@rbx/ui';
import { getRegionalPricingPreviewKey } from '@modules/regional-pricing/queries/useGetRegionalPricingPreview';
import type { ConfigureSalesFormValues } from '../form-shared/types';
import { configurePassSalesSchema } from '../form-shared/schemas';

// Set up individual text field inputs to limit subscription to specific errors
export type FieldProps = {
  register: UseFormRegister<ConfigureSalesFormValues>;
  label: string;
  disabled?: boolean;
  className?: string;
};

export const PriceTextField = memo(
  ({
    register,
    helperText,
    universeId,
    label,
    disabled,
    className,
  }: FieldProps & { universeId: number; helperText?: string }) => {
    const { translate } = useTranslation();
    const { errors } = useFormState<ConfigureSalesFormValues>({
      name: 'price',
    });

    const isFetchingRegionalPrices = useIsFetching({
      queryKey: getRegionalPricingPreviewKey(universeId, 'GamePass'),
    });

    const isRegionalPricingEnabled = useWatch<ConfigureSalesFormValues, 'isRegionalPricingEnabled'>(
      { name: 'isRegionalPricingEnabled' },
    );

    const priceFieldHelperText =
      helperText || (errors.price?.message ? translate(errors.price.message) : null);

    return (
      <TextField
        id='price'
        {...register('price', configurePassSalesSchema.price)}
        className={className}
        required={!!isRegionalPricingEnabled}
        fullWidth
        disabled={disabled}
        inputMode='numeric'
        label={label}
        error={!!errors.price}
        helperText={priceFieldHelperText}
        InputProps={{
          startAdornment: (
            <InputAdornment position='start'>
              <RobuxIcon fontSize='small' />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position='end'>
              {isFetchingRegionalPrices ? <CircularProgress /> : null}
            </InputAdornment>
          ),
        }}
        FormHelperTextProps={{ 'aria-live': 'polite' }}
      />
    );
  },
);
PriceTextField.displayName = 'PriceTextField';
