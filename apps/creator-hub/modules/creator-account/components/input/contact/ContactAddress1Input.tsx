import React, { FunctionComponent } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TextField } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { ContactInputProps } from './types';
import { InputFormData } from '../../../types';

const ContactAddress1Input: FunctionComponent<React.PropsWithChildren<ContactInputProps>> = ({
  disabled,
}) => {
  const { control, formState } = useFormContext<InputFormData>();
  const { translate } = useTranslation();

  return (
    <Controller
      name='contactInfo.address.address1'
      control={control}
      defaultValue=''
      rules={{
        required: translate('Message.Contact.AddressRequired'),
        validate: {
          maxLength: (input: string) => {
            return (input?.length ?? 0) < 200 || translate('Message.Contact.AddressMaxLength');
          },
        },
      }}
      render={({ field }) => (
        <TextField
          {...field}
          fullWidth
          required
          id='contactInfo.address.address1'
          label={translate('Label.Contact.Address1')}
          error={!!formState.errors.contactInfo?.address?.address1}
          helperText={formState.errors.contactInfo?.address?.address1?.message}
          disabled={disabled}
        />
      )}
    />
  );
};

export default withTranslation(ContactAddress1Input, [TranslationNamespace.CreatorAccount]);
