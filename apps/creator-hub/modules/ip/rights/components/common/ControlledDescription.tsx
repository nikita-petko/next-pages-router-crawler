import React, { useMemo } from 'react';
import type { Control, FieldError } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TextField } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

export const DEFAULT_MAX_CHARACTER_COUNT = 1000;
const DEFAULT_LABEL_KEY = 'Label.Description';
const DEFAULT_PLACEHOLDER_KEY = 'Description.DescriptionPlaceholder';

interface ControlledDescriptionProps {
  description: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- field values can be of any type
  control: Control<any>;
  required?: boolean;
  maxCharacterCount?: number;
  labelKey?: string;
  placeholderKey?: string;
  error?: FieldError;
}

/**
 * ControlledDescription is a controlled input box for description with specific rules in place.
 * Wrapping component(s) should handle styling.
 */
const ControlledDescription = ({
  description,
  control,
  error,
  required = false,
  maxCharacterCount = DEFAULT_MAX_CHARACTER_COUNT,
  labelKey = DEFAULT_LABEL_KEY,
  placeholderKey = DEFAULT_PLACEHOLDER_KEY,
}: ControlledDescriptionProps) => {
  const { ready, translate } = useTranslation();

  const descriptionHelperText = useMemo(() => {
    return translate('Description.CharacterCount', {
      count: description.length.toString(),
      max: maxCharacterCount.toString(),
    });
  }, [description, maxCharacterCount, translate]);

  if (!ready) {
    return null;
  }

  return (
    <Controller
      name='description'
      control={control}
      rules={{
        validate: {
          required: (value) =>
            value.length <= maxCharacterCount ||
            translate('Error.TooManyCharacters', {
              max: maxCharacterCount.toString(),
            }),
        },
      }}
      render={({ field }) => (
        <TextField
          {...field}
          id='description'
          label={translate(labelKey)}
          placeholder={translate(placeholderKey)}
          fullWidth
          multiline
          required={required}
          error={!!error}
          helperText={error?.message || descriptionHelperText}
        />
      )}
    />
  );
};

export default withTranslation(ControlledDescription, [TranslationNamespace.RightsPortal]);
