import React, { FunctionComponent } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TextField } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { ContactInputProps } from './types';
import { InputFormData } from '../../../types';

const ContactEmailInput: FunctionComponent<React.PropsWithChildren<ContactInputProps>> = ({
  disabled,
}) => {
  const { control, formState } = useFormContext<InputFormData>();
  const { translate } = useTranslation();

  return (
    <Controller
      name='contactInfo.email'
      control={control}
      defaultValue=''
      rules={{
        required: translate('Message.Contact.EmailRequired'),
        pattern: {
          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          message: translate('Message.Contact.EmailInvalid'),
        },
        validate: {
          maxLength: (input: string) => {
            const length = input?.length ?? 0;
            return (length >= 5 && length <= 320) || translate('Message.Contact.EmailLength');
          },
        },
      }}
      render={({ field }) => (
        <TextField
          {...field}
          fullWidth
          required
          id='contactInfo.email'
          type='email'
          label={translate('Label.Contact.Email')}
          error={!!formState.errors.contactInfo?.email}
          helperText={formState.errors.contactInfo?.email?.message}
          disabled={disabled}
        />
      )}
    />
  );
};

export default withTranslation(ContactEmailInput, [TranslationNamespace.CreatorAccount]);
