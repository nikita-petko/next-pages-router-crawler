import React from 'react';
import {
  Control,
  Controller,
  FieldValues,
  FormState,
  Path,
  UseControllerProps,
} from 'react-hook-form';
import { TextField } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';

interface NameTextFieldProps<T extends FieldValues> extends UseControllerProps<T> {
  isDisabled: boolean;
  labelName?: string;
  errorMessage: string;
  formState: FormState<T>;
  control: Control<T>;
  name: Path<T>;
}

const NameTextField = function NameTextFieldProps<T extends FieldValues>({
  isDisabled,
  labelName,
  errorMessage,
  formState,
  control,
  name,
}: NameTextFieldProps<T>): React.JSX.Element {
  const { errors } = formState;
  const { translate } = useTranslation();

  const fieldRules = {
    required: 'Error.Required',
    maxLength: 50,
  };

  return (
    <Controller
      name={name}
      control={control}
      rules={fieldRules}
      render={({ field }) => (
        <TextField
          {...field}
          disabled={isDisabled}
          error={!!errors.name}
          fullWidth
          required
          id='name'
          inputProps={{ maxLength: fieldRules.maxLength }}
          label={labelName ?? translate('Label.Name')}
          helperText={
            errors.name && errors.name.message
              ? translate(errorMessage)
              : translate('Description.Name', {
                  limit: fieldRules.maxLength.toString(),
                })
          }
        />
      )}
    />
  );
};

export default NameTextField;
