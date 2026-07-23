import React, { FunctionComponent } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TextField } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { ContactInputProps } from './types';
import { InputFormData } from '../../../types';

const ContactAddress2Input: FunctionComponent<React.PropsWithChildren<ContactInputProps>> = ({
  disabled,
}) => {
  const { control, formState } = useFormContext<InputFormData>();
  const { translate } = useTranslation();

  return (
    <Controller
      name='contactInfo.address.address2'
      control={control}
      defaultValue=''
      rules={{
        validate: {
          maxLength: (input: string) => {
            return (input?.length ?? 0) < 100 || translate('Message.Contact.AddressMaxLength');
          },
        },
      }}
      render={({ field }) => (
        <TextField
          {...field}
          fullWidth
          id='contactInfo.address.address2'
          label={translate('Label.Contact.Address2')}
          error={!!formState.errors.contactInfo?.address?.address2}
          helperText={formState.errors.contactInfo?.address?.address2?.message}
          disabled={disabled}
        />
      )}
    />
  );
};

export default withTranslation(ContactAddress2Input, [TranslationNamespace.CreatorAccount]);
