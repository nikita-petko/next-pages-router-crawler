import { Typography } from '@rbx/ui';

import useFormLayoutStyles from '@components/campaignBuilder/common/FormLayout.styles';
import AdvancedTargetingAudienceEstimate from '@components/campaignBuilder/targeting/AdvancedTargetingAudienceEstimate';
import useAdvancedTargetingAudienceSectionStyles from '@components/campaignBuilder/targeting/AdvancedTargetingAudienceSection.styles';
import AdvancedTargetingGenericAutocomplete from '@components/campaignBuilder/targeting/AdvancedTargetingGenericAutocomplete';
import AdvancedTargetingGenreAutocomplete from '@components/campaignBuilder/targeting/AdvancedTargetingGenreAutocomplete';
import AdvancedTargetingLocationAutocomplete from '@components/campaignBuilder/targeting/AdvancedTargetingLocationAutocomplete';
import useDrawerStyles from '@components/common/Drawer.styles';
import {
  DeviceOptions,
  FormField,
  GenderOptions,
  GetAgeOptions,
} from '@constants/advancedTargeting';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { useAppStore } from '@stores/appStoreProvider';

const AdvancedTargetingAudienceSection = () => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const {
    classes: { drawerSection, splitRow },
  } = useDrawerStyles();

  const {
    classes: { fullWidth, halfWidth },
  } = useFormLayoutStyles();

  const {
    classes: { audienceEstimateHalfWidthWrapper },
  } = useAdvancedTargetingAudienceSectionStyles();

  const { isAge5To12TargetingEnabled } = useAppStore((state) => ({
    isAge5To12TargetingEnabled: state.appMetadataState.data.isAge5To12TargetingEnabled,
  }));

  const ageOptions = GetAgeOptions(isAge5To12TargetingEnabled);

  const renderAgeAndGenderRow = () => (
    <div className={splitRow}>
      <AdvancedTargetingGenericAutocomplete
        className={halfWidth}
        formField={FormField.AGES}
        label={translate('Label.Ages')}
        options={ageOptions}
      />
      <AdvancedTargetingGenericAutocomplete
        className={halfWidth}
        formField={FormField.GENDERS}
        label={translate('Label.Genders')}
        options={GenderOptions}
      />
    </div>
  );

  const renderGenreRow = () => <AdvancedTargetingGenreAutocomplete />;

  return (
    <div className={drawerSection}>
      <div className={audienceEstimateHalfWidthWrapper}>
        <AdvancedTargetingAudienceEstimate isEstimateAvailable />
      </div>
      <Typography variant='h5'>{translate('Heading.Audience')}</Typography>
      <AdvancedTargetingLocationAutocomplete />
      {renderAgeAndGenderRow()}
      {renderGenreRow()}
      <AdvancedTargetingGenericAutocomplete
        className={fullWidth}
        formField={FormField.DEVICES}
        label={translate('Label.Devices')}
        options={DeviceOptions}
      />
    </div>
  );
};

export default AdvancedTargetingAudienceSection;
