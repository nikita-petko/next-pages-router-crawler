import React, { FunctionComponent } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TextField } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { ContactInputProps } from './types';
import { InputFormData } from '../../../types';

const ContactAddressStateInput: FunctionComponent<React.PropsWithChildren<ContactInputProps>> = ({
  disabled,
}) => {
  const { control, formState } = useFormContext<InputFormData>();
  const { translate } = useTranslation();

  return (
    <Controller
      name='contactInfo.address.state'
      control={control}
      defaultValue=''
      rules={{
        required: translate('Message.Contact.StateRequired'),
        validate: {
          maxLength: (input: string) => {
            return (input?.length ?? 0) < 200 || translate('Message.Contact.StateMaxLength');
          },
        },
      }}
      render={({ field }) => (
        <TextField
          {...field}
          fullWidth
          required
          id='contactInfo.address.state'
          label={translate('Label.Contact.State')}
          error={!!formState.errors.contactInfo?.address?.state}
          helperText={formState.errors.contactInfo?.address?.state?.message}
          disabled={disabled}
        />
      )}
    />
  );
};

export default withTranslation(ContactAddressStateInput, [TranslationNamespace.CreatorAccount]);
