import type { Control } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { useTranslation } from '@rbx/intl';
import { Typography, Switch, Tooltip, InfoOutlinedIcon } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useImmersiveAdsPageStyles from '../pages/ImmersiveAdsPage.styles';
import type { AdSettingsFormData } from './interfaces';

interface SettingsCheckboxRowProps {
  labelTranslationKey: string;
  tooltipTranslationKey: string;
  fieldName: keyof AdSettingsFormData;
  control: Control<AdSettingsFormData>;
  disabled?: boolean;
}

const SettingsCheckboxRow = ({
  labelTranslationKey,
  tooltipTranslationKey,
  fieldName,
  control,
  disabled = false,
}: SettingsCheckboxRowProps) => {
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
            disabled={disabled}
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
