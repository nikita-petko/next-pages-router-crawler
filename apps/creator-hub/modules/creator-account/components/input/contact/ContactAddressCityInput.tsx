import React, { FunctionComponent } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TextField } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { ContactInputProps } from './types';
import { InputFormData } from '../../../types';

const ContactAddressCityInput: FunctionComponent<React.PropsWithChildren<ContactInputProps>> = ({
  disabled,
}) => {
  const { control, formState } = useFormContext<InputFormData>();
  const { translate } = useTranslation();

  return (
    <Controller
      name='contactInfo.address.city'
      control={control}
      defaultValue=''
      rules={{
        required: translate('Message.Contact.CityRequired'),
        validate: {
          maxLength: (input: string) => {
            return (input?.length ?? 0) < 200 || translate('Message.Contact.CityMaxLength');
          },
        },
      }}
      render={({ field }) => (
        <TextField
          {...field}
          fullWidth
          required
          id='contactInfo.address.city'
          label={translate('Label.Contact.City')}
          error={!!formState.errors.contactInfo?.address?.city}
          helperText={formState.errors.contactInfo?.address?.city?.message}
          disabled={disabled}
        />
      )}
    />
  );
};

export default withTranslation(ContactAddressCityInput, [TranslationNamespace.CreatorAccount]);
