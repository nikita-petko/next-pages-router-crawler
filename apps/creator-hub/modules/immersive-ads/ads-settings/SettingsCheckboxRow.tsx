import React, { FC } from 'react';
import { Controller, Control } from 'react-hook-form';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { translationKey, useTranslationWrapper } from '@modules/analytics-translations';
import { useTranslation } from '@rbx/intl';
import { Typography, Switch, Tooltip, InfoOutlinedIcon } from '@rbx/ui';
import useImmersiveAdsPageStyles from '../pages/ImmersiveAdsPage.styles';
import { AdSettingsFormData } from './interfaces';

export interface SettingsCheckboxRowProps {
  labelTranslationKey: string;
  tooltipTranslationKey: string;
  fieldName: keyof AdSettingsFormData;
  control: Control<AdSettingsFormData>;
}

const SettingsCheckboxRow: FC<SettingsCheckboxRowProps> = ({
  labelTranslationKey,
  tooltipTranslationKey,
  fieldName,
  control,
}) => {
  const { translate } = useTranslationWrapper(useTranslation());

  const {
    classes: { settingsCheckboxRow, settingsCheckBoxLabel },
  } = useImmersiveAdsPageStyles();

  return (
    <div className={settingsCheckboxRow}>
      <Controller
        name={fieldName}
        control={control}
        render={({ field }) => (
          <Switch
            checked={field.value}
            onChange={(event) => field.onChange(event.target.checked)}
            aria-label=''
          />
        )}
      />
      <div className={settingsCheckBoxLabel}>
        <Typography variant='body1'>
          {translate(
            translationKey(labelTranslationKey, TranslationNamespace.ImmersiveAdsAnalytics),
          )}
        </Typography>
        <Tooltip
          title={translate(
            translationKey(tooltipTranslationKey, TranslationNamespace.ImmersiveAdsAnalytics),
          )}
          placement='right'
          arrow>
          <InfoOutlinedIcon color='disabled' />
        </Tooltip>
      </div>
    </div>
  );
};

export default SettingsCheckboxRow;
