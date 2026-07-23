import type { FunctionComponent } from 'react';
import React from 'react';
import type { Control, FormState, UseFormGetValues } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { useTranslation } from '@rbx/intl';
import { TextField } from '@rbx/ui';
import { FieldErrorType, maxDescriptionLength } from '../../common/constants';
import type { CreateEventFormType } from '../types';
import { CreateEventRegisterOptions } from '../types';

export interface EventDescriptionFieldProps {
  formState: FormState<CreateEventFormType>;
  control: Control<CreateEventFormType>;
  getValues: UseFormGetValues<CreateEventFormType>;
}

const EventDescriptionField: FunctionComponent<
  React.PropsWithChildren<EventDescriptionFieldProps>
> = ({ formState, control, getValues }) => {
  const { translate } = useTranslation();
  const { errors } = formState;

  const getDescriptionHelperText = (): string | undefined => {
    if (
      formState.errors.description &&
      !(formState.errors.description.type === FieldErrorType.MaxLength)
    ) {
      return translate('Tooltip.InvalidDescription');
    }
    return `${getValues('description')?.length ?? 0}/${maxDescriptionLength}`;
  };

  return (
    <Controller
      name='description'
      control={control}
      rules={CreateEventRegisterOptions.description}
      render={({ field }) => (
        <TextField
          {...field}
          error={!!errors.description}
          fullWidth
          multiline
          minRows={3}
          id='description'
          label={translate('Label.Description')}
          FormHelperTextProps={{ 'aria-live': 'polite' }}
          helperText={getDescriptionHelperText()}
        />
      )}
    />
  );
};

export default EventDescriptionField;
