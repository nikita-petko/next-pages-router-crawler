import React, { FunctionComponent } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TextField } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { ContactInputProps } from './types';
import { InputFormData } from '../../../types';

const ContactNameInput: FunctionComponent<React.PropsWithChildren<ContactInputProps>> = ({
  disabled,
}) => {
  const { control, formState } = useFormContext<InputFormData>();
  const { translate } = useTranslation();

  return (
    <Controller
      name='contactInfo.name'
      control={control}
      defaultValue=''
      rules={{
        required: translate('Message.Contact.NameRequired'),
        validate: {
          maxLength: (input: string) => {
            const length = input?.length ?? 0;
            return (length >= 3 && length <= 60) || translate('Message.Contact.NameLength');
          },
        },
      }}
      render={({ field }) => (
        <TextField
          {...field}
          fullWidth
          required
          id='contactInfo.name'
          label={translate('Label.Contact.Name')}
          error={!!formState.errors.contactInfo?.name}
          helperText={formState.errors.contactInfo?.name?.message}
          disabled={disabled}
        />
      )}
    />
  );
};

export default withTranslation(ContactNameInput, [TranslationNamespace.CreatorAccount]);
