import React, { FunctionComponent } from 'react';
import { useTranslation } from '@rbx/intl';
import { TextField } from '@rbx/ui';
import { Control, Controller, FormState, UseFormGetValues } from 'react-hook-form';
import { FieldErrorType, maxDescriptionLength } from '../../common/constants';
import { CreateEventFormType, CreateEventRegisterOptions } from '../types';

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
