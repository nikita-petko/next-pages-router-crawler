import { memo } from 'react';
import { Control, Controller } from 'react-hook-form';
import { useTranslation } from '@rbx/intl';
import { TextField } from '@rbx/ui';
import { useLanguageDirection } from '@modules/monetization-shared/useLanguageDirection';
import type { ConfigurePassMetadataFormValues } from './types';
import { configurePassMetadataSchema, MAX_DESCRIPTION_LENGTH, MAX_NAME_LENGTH } from './schemas';

// Set up individual text field inputs to limit subscription to specific errors
export type FieldProps = {
  control: Control<ConfigurePassMetadataFormValues>;
  label: string;
  disabled?: boolean;
  className?: string;
};

const getTextLengthMessage = (
  max: number,
  current: number,
  translate: (key: string, args?: { [key: string]: string }) => string,
) => {
  if (current === 0) {
    return translate('Message.CharacterLimit', { limit: String(max) });
  }
  return translate('Message.ProgressiveCharacterLimit', { count: String(max - current) });
};

export const NameTextField = memo(({ control, label, disabled, className }: FieldProps) => {
  const { translate } = useTranslation();
  const dir = useLanguageDirection();

  return (
    // Note we need a controlled input here to show progressive character limit
    <Controller
      name='name'
      control={control}
      disabled={disabled}
      rules={configurePassMetadataSchema.name}
      render={({ field, fieldState: { error } }) => (
        <TextField
          {...field}
          id='name'
          dir={dir}
          className={className}
          fullWidth
          multiline
          required
          disabled={disabled}
          label={label}
          error={!!error}
          helperText={
            error?.message
              ? translate(error.message ?? '')
              : getTextLengthMessage(MAX_NAME_LENGTH, field.value.length, translate)
          }
          FormHelperTextProps={{ 'aria-live': 'polite' }}
        />
      )}
    />
  );
});
NameTextField.displayName = 'NameTextField';

export const DescriptionTextField = memo(({ control, label, disabled, className }: FieldProps) => {
  const { translate } = useTranslation();
  const dir = useLanguageDirection();

  return (
    // Note we need a controlled input here to show progressive character limit
    <Controller
      name='description'
      control={control}
      disabled={disabled}
      rules={configurePassMetadataSchema.description}
      render={({ field, fieldState: { error } }) => (
        <TextField
          {...field}
          id='description'
          dir={dir}
          className={className}
          fullWidth
          multiline
          minRows={6}
          disabled={disabled}
          label={label}
          error={!!error}
          helperText={
            error?.message
              ? translate(error.message ?? '')
              : getTextLengthMessage(MAX_DESCRIPTION_LENGTH, field.value.length, translate)
          }
          FormHelperTextProps={{ 'aria-live': 'polite' }}
        />
      )}
    />
  );
});
DescriptionTextField.displayName = 'DescriptionTextField';
