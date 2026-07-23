import React, { FunctionComponent } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { useTranslation, withTranslation } from '@rbx/intl';
import { MenuItem, Select } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { GrantableType } from '@rbx/clients/commerceApi/v1';
import { VirtualBenefitFormType } from '../types';

const GrantableTypeSelect: FunctionComponent = () => {
  const { control, formState } = useFormContext<VirtualBenefitFormType>();
  const { translate } = useTranslation();

  return (
    <Controller
      name='grantableType'
      control={control}
      defaultValue=''
      render={({ field }) => (
        <Select
          {...field}
          sx={{ minWidth: { xs: '279px', sm: '100%' }, mb: 2 }}
          label={translate('Label.VirtualBenefitType')}
          margin='none'
          size='medium'
          variant='outlined'
          error={!!formState.errors.grantableType}>
          <MenuItem value={GrantableType.AvatarItem}>{translate('Label.AvatarItem')}</MenuItem>
          {
            // Not supporting bundle for now
            // <MenuItem value={GrantableType.Bundle}>{translate('Label.Bundle')}</MenuItem>
          }
          <MenuItem value={GrantableType.DeveloperProduct}>
            {translate('Label.DeveloperProduct')}
          </MenuItem>
        </Select>
      )}
    />
  );
};

export default withTranslation(GrantableTypeSelect, [TranslationNamespace.Commerce]);
