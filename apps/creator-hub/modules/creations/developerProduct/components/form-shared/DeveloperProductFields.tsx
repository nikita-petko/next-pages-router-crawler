import { memo } from 'react';
import { UseFormRegister, useFormState, useWatch } from 'react-hook-form';
import { useIsFetching } from '@tanstack/react-query';
import { useTranslation } from '@rbx/intl';
import { CircularProgress, InputAdornment, RobuxIcon, TextField } from '@rbx/ui';
import { getRegionalPricingPreviewKey } from '@modules/regional-pricing/queries/useGetRegionalPricingPreview';
import { useLanguageDirection } from '@modules/monetization-shared/useLanguageDirection';
import type { ConfigureDeveloperProductFormV2Values } from '../../types';
import {
  configureDeveloperProductSchema,
  MAX_DESCRIPTION_LENGTH,
  MAX_NAME_LENGTH,
} from './schemas';

// Set up individual text field inputs to limit subscription to specific errors
export type FieldProps = {
  register: UseFormRegister<ConfigureDeveloperProductFormV2Values>;
  label: string;
  disabled?: boolean;
  className?: string;
};

export const NameTextField = memo(({ register, label, disabled, className }: FieldProps) => {
  const { translate } = useTranslation();
  const dir = useLanguageDirection();

  const { errors } = useFormState<ConfigureDeveloperProductFormV2Values>({
    name: 'name',
  });

  return (
    <TextField
      id='name'
      {...register('name', configureDeveloperProductSchema.name)}
      dir={dir}
      className={className}
      fullWidth
      multiline
      required
      disabled={disabled}
      label={label}
      error={!!errors.name}
      helperText={
        errors.name?.message
          ? translate(errors.name.message)
          : translate('Message.CharacterLimit', {
              limit: MAX_NAME_LENGTH.toString(),
            })
      }
      FormHelperTextProps={{ 'aria-live': 'polite' }}
    />
  );
});
NameTextField.displayName = 'NameTextField';

export const DescriptionTextField = memo(({ register, label, disabled, className }: FieldProps) => {
  const { translate } = useTranslation();
  const dir = useLanguageDirection();

  const { errors } = useFormState<ConfigureDeveloperProductFormV2Values>({
    name: 'description',
  });

  return (
    <TextField
      id='description'
      {...register('description', configureDeveloperProductSchema.description)}
      dir={dir}
      className={className}
      fullWidth
      multiline
      disabled={disabled}
      label={label}
      error={!!errors.description}
      helperText={
        errors.description?.message
          ? translate(errors.description.message)
          : translate('Message.CharacterLimit', {
              limit: MAX_DESCRIPTION_LENGTH.toString(),
            })
      }
      FormHelperTextProps={{ 'aria-live': 'polite' }}
    />
  );
});
DescriptionTextField.displayName = 'DescriptionTextField';

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
    const { errors } = useFormState<ConfigureDeveloperProductFormV2Values>({
      name: 'price',
    });

    const isFetchingRegionalPrices = useIsFetching({
      queryKey: getRegionalPricingPreviewKey(universeId, 'DeveloperProduct'),
    });

    const [isRegionalPricingEnabled, storePageEnabled] = useWatch<
      ConfigureDeveloperProductFormV2Values,
      ['isRegionalPricingEnabled', 'storePageEnabled']
    >({ name: ['isRegionalPricingEnabled', 'storePageEnabled'] });

    const priceFieldHelperText =
      helperText || (errors.price?.message ? translate(errors.price.message) : null);

    return (
      <TextField
        id='price'
        {...register('price', configureDeveloperProductSchema.price)}
        className={className}
        required={isRegionalPricingEnabled || storePageEnabled}
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
