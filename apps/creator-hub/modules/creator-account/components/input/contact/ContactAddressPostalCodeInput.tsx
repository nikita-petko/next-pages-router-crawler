import React, { FunctionComponent } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TextField } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { ContactInputProps } from './types';
import { InputFormData } from '../../../types';

const ContactAddressPostalCodeInput: FunctionComponent<
  React.PropsWithChildren<ContactInputProps>
> = ({ disabled }) => {
  const { control, formState } = useFormContext<InputFormData>();
  const { translate } = useTranslation();

  return (
    <Controller
      name='contactInfo.address.postalCode'
      control={control}
      defaultValue=''
      rules={{
        required: translate('Message.Contact.PostalCodeRequired'),
        validate: {
          maxLength: (input: string) => {
            return (input?.length ?? 0) < 200 || translate('Message.Contact.PostalCodeMaxLength');
          },
        },
      }}
      render={({ field }) => (
        <TextField
          {...field}
          fullWidth
          required
          id='contactInfo.address.postalCode'
          label={translate('Label.Contact.PostalCode')}
          error={!!formState.errors.contactInfo?.address?.postalCode}
          helperText={formState.errors.contactInfo?.address?.postalCode?.message}
          disabled={disabled}
        />
      )}
    />
  );
};

export default withTranslation(ContactAddressPostalCodeInput, [
  TranslationNamespace.CreatorAccount,
]);
