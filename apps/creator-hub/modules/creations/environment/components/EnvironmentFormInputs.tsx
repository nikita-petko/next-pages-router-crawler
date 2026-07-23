import React, { FunctionComponent } from 'react';
import { useTranslation } from '@rbx/intl';
import { TextField, Grid } from '@rbx/ui';
import {
  UseFormRegister,
  UseFormSetError,
  FieldErrors,
  UseFormWatch,
  UseFormSetValue,
  UseFormClearErrors,
} from 'react-hook-form';
import { validateEnvironmentSlug, slugify } from '../utils/environmentUtils';

interface EnvironmentFormData {
  displayName: string;
  slug: string;
}

interface EnvironmentFormInputsProps {
  register: UseFormRegister<EnvironmentFormData>;
  setError: UseFormSetError<EnvironmentFormData>;
  errors: FieldErrors<EnvironmentFormData>;
  watch: UseFormWatch<EnvironmentFormData>;
  setValue: UseFormSetValue<EnvironmentFormData>;
  clearErrors: UseFormClearErrors<EnvironmentFormData>;
  disabled?: boolean;
}

const EnvironmentFormInputs: FunctionComponent<EnvironmentFormInputsProps> = ({
  register,
  setError,
  errors,
  watch,
  setValue,
  clearErrors,
  disabled,
}) => {
  const { translate } = useTranslation();
  const displayName = watch('displayName');
  const slug = watch('slug');

  const handleDisplayNameBlur = () => {
    // Only auto-populate slug if it's empty
    if (!slug && displayName) {
      const newSlug = slugify(displayName);
      if (newSlug) {
        setValue('slug', newSlug, { shouldValidate: true });
        // Clear any existing errors and validate the new slug
        clearErrors('slug');
        const validationError = validateEnvironmentSlug(newSlug);
        if (validationError) {
          setError('slug', { message: translate(validationError) });
        }
      }
    }
  };

  return (
    <Grid container direction='column' spacing={3}>
      <Grid item>
        <TextField
          {...register('displayName', { required: true })}
          id='display-name'
          required
          fullWidth
          label={translate('Label.DisplayName')}
          inputProps={{ maxLength: 32 }}
          InputLabelProps={{ shrink: true }}
          FormHelperTextProps={{ 'aria-live': 'polite' }}
          helperText={`${displayName?.length || 0}/32`}
          disabled={disabled}
          onBlur={handleDisplayNameBlur}
        />
      </Grid>
      <Grid item>
        <TextField
          {...register('slug', {
            required: true,
            onChange: (e) => {
              const newSlug = e.target.value.toLowerCase();
              e.target.value = newSlug;
              const validationError = validateEnvironmentSlug(newSlug);
              if (validationError) {
                setError('slug', { message: translate(validationError) });
              } else {
                clearErrors('slug');
              }
            },
            validate: (value) => {
              if (!value) return true;
              const validationError = validateEnvironmentSlug(value);
              return validationError ? translate(validationError) : true;
            },
          })}
          id='environment-slug'
          required
          fullWidth
          label={translate('Label.EnvironmentSlug')}
          InputLabelProps={{ shrink: true }}
          error={!!errors.slug}
          helperText={errors.slug?.message || `${slug?.length || 0}/36`}
          inputProps={{ maxLength: 36 }}
          disabled={disabled}
        />
      </Grid>
    </Grid>
  );
};

export default EnvironmentFormInputs;
