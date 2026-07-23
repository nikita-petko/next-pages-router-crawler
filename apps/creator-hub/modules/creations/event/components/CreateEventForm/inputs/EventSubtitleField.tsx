import React, { FunctionComponent } from 'react';
import { useTranslation } from '@rbx/intl';
import { TextField } from '@rbx/ui';
import { Control, Controller, FormState } from 'react-hook-form';
import { FieldErrorType } from '../../common/constants';
import { CreateEventFormType, CreateEventRegisterOptions } from '../types';

export interface EventSubtitleFieldProps {
  formState: FormState<CreateEventFormType>;
  control: Control<CreateEventFormType>;
}

const EventSubtitleField: FunctionComponent<React.PropsWithChildren<EventSubtitleFieldProps>> = ({
  formState,
  control,
}) => {
  const { translate } = useTranslation();
  const { errors } = formState;

  const getSubtitleHelperText = (): string | undefined => {
    if (errors.subtitle) {
      if (errors.subtitle.type === FieldErrorType.Required) {
        return translate('Tooltip.MissingFields');
      }
      if (errors.subtitle.type === FieldErrorType.MaxLength) {
        return translate('Tooltip.EventSubtitleTooLong');
      }
      return translate('Tooltip.EEInvalidSubtitle');
    }
    return undefined;
  };

  return (
    <Controller
      name='subtitle'
      control={control}
      rules={CreateEventRegisterOptions.subtitle}
      render={({ field }) => (
        <TextField
          {...field}
          error={!!errors.subtitle}
          fullWidth
          required
          id='subtitle'
          label={translate('Label.EESubtitle')}
          FormHelperTextProps={{ 'aria-live': 'polite' }}
          helperText={getSubtitleHelperText()}
        />
      )}
    />
  );
};

export default EventSubtitleField;
