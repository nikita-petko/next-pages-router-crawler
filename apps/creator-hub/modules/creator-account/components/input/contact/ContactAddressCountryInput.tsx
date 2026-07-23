import React, { FunctionComponent } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TextField, Autocomplete } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { InputFormData } from '../../../types';

interface ContactAddressCountryInputProps {
  countries: string[];
  disabled?: boolean;
}

const ContactAddressCountryInput: FunctionComponent<ContactAddressCountryInputProps> = ({
  countries,
  disabled,
}) => {
  const { control, formState } = useFormContext<InputFormData>();
  const { translate } = useTranslation();

  return (
    <Controller
      name='contactInfo.address.country'
      control={control}
      defaultValue=''
      rules={{
        required: translate('Message.Contact.CountryRequired'),
      }}
      render={({ field }) => {
        return (
          <Autocomplete
            {...field}
            value={field.value || null}
            onChange={(_, value) => field.onChange(value)}
            autoComplete
            autoHighlight
            options={countries}
            getOptionLabel={(option) => option}
            renderInput={(params) => (
              <TextField
                {...params}
                fullWidth
                required
                id='contactInfo.address.country'
                label={translate('Label.Contact.Country')}
                error={!!formState.errors.contactInfo?.address?.country}
                helperText={formState.errors.contactInfo?.address?.country?.message}
                disabled={disabled}
              />
            )}
          />
        );
      }}
    />
  );
};

export default withTranslation(ContactAddressCountryInput, [TranslationNamespace.CreatorAccount]);
