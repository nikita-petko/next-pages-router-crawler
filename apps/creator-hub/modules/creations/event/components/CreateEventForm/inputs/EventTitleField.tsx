import React, { FunctionComponent } from 'react';
import { useTranslation } from '@rbx/intl';
import { TextField } from '@rbx/ui';
import { Control, Controller, FormState } from 'react-hook-form';
import { FieldErrorType } from '../../common/constants';
import { CreateEventFormType, CreateEventRegisterOptions } from '../types';

export interface EventTitleFieldProps {
  formState: FormState<CreateEventFormType>;
  control: Control<CreateEventFormType>;
  useM3Validation: boolean;
}

const EventTitleField: FunctionComponent<React.PropsWithChildren<EventTitleFieldProps>> = ({
  formState,
  control,
}) => {
  const { translate } = useTranslation();
  const { errors } = formState;

  const getTitleHelperText = (): string | undefined => {
    if (formState.errors.title) {
      if (formState.errors.title.type === FieldErrorType.Required) {
        return translate('Tooltip.MissingFields');
      }
      if (formState.errors.title.type === FieldErrorType.MaxLength) {
        return translate('Tooltip.EventNameTooLong');
      }
      return translate('Tooltip.InvalidEventName');
    }
    return undefined;
  };

  return (
    <Controller
      name='title'
      control={control}
      rules={CreateEventRegisterOptions.title}
      render={({ field }) => (
        <TextField
          {...field}
          error={!!errors.title}
          fullWidth
          required
          id='title'
          label={translate('Label.EventTitle')}
          FormHelperTextProps={{ 'aria-live': 'polite' }}
          helperText={getTitleHelperText()}
        />
      )}
    />
  );
};

export default EventTitleField;
