import React, { FunctionComponent } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TextField } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

import { VirtualBenefitFormType, VirtualBenefitRegisterOptions } from '../types';

const NameInput: FunctionComponent = () => {
  const { control, formState } = useFormContext<VirtualBenefitFormType>();
  const { translate } = useTranslation();

  return (
    <Controller
      name='name'
      control={control}
      rules={VirtualBenefitRegisterOptions.name}
      render={({ field }) => (
        <TextField
          {...field}
          error={!!formState.errors.name}
          fullWidth
          multiline
          required
          id='name'
          label={translate('Label.Name')}
          inputProps={{ maxLength: VirtualBenefitRegisterOptions.name.maxLength }}
          helperText={translate('Message.CharacterLimit', {
            limit: VirtualBenefitRegisterOptions.name.maxLength.toString(),
          })}
        />
      )}
    />
  );
};

export default withTranslation(NameInput, [TranslationNamespace.Commerce]);
