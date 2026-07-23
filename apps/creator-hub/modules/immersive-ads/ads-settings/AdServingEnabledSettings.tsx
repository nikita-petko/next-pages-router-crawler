import type { Control } from 'react-hook-form';
import {
  RewardedAdsServingEnabledLabelKey,
  RewardedAdsServingEnabledTooltipKey,
} from '../constants/adsSettingsTranslationKeys';
import type { AdSettingsFormData } from './interfaces';
import SettingsCheckboxRow from './SettingsCheckboxRow';

interface AdServingEnabledSettingsProps {
  control: Control<AdSettingsFormData>;
  disabled?: boolean;
}

const AdServingEnabledSettings = ({ control, disabled = false }: AdServingEnabledSettingsProps) => {
  return (
    <SettingsCheckboxRow
      labelTranslationKey={RewardedAdsServingEnabledLabelKey.key}
      tooltipTranslationKey={RewardedAdsServingEnabledTooltipKey.key}
      fieldName='isRewardedAdsEnabled'
      control={control}
      disabled={disabled}
    />
  );
};

export default AdServingEnabledSettings;
