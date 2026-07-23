import React, { FunctionComponent } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TextField } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

import { VirtualBenefitFormType, VirtualBenefitRegisterOptions } from '../types';

const DescriptionInput: FunctionComponent = () => {
  const { control, formState } = useFormContext<VirtualBenefitFormType>();
  const { translate } = useTranslation();

  return (
    <Controller
      name='description'
      control={control}
      rules={VirtualBenefitRegisterOptions.description}
      render={({ field }) => (
        <TextField
          {...field}
          fullWidth
          multiline
          id='description'
          required
          label={translate('Label.Description')}
          error={!!formState.errors.description}
          helperText={translate('Message.CharacterLimit', {
            limit: VirtualBenefitRegisterOptions.description.maxLength.toString(),
          })}
          inputProps={{
            maxLength: VirtualBenefitRegisterOptions.description.maxLength,
          }}
          minRows={6}
        />
      )}
    />
  );
};

export default withTranslation(DescriptionInput, [TranslationNamespace.Commerce]);
