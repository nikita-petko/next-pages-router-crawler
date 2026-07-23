import { useMemo } from 'react';
import type { Control } from 'react-hook-form';
import { useTranslation } from '@rbx/intl';
import { Accordion, AccordionDetails, AccordionSummary, Typography } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useEligibility } from '../contexts/EligibilityContext';
import useImmersiveAdsPageStyles from '../pages/ImmersiveAdsPage.styles';
import type { AdSettingsFormData } from './interfaces';
import SettingsCheckboxRow from './SettingsCheckboxRow';

interface AdTypeSettingsProps {
  control: Control<AdSettingsFormData>;
  disabled?: boolean;
}

const AdTypeSettings = ({ control, disabled = false }: AdTypeSettingsProps) => {
  const { translate } = useTranslationWrapper(useTranslation());
  const {
    eligibilityState: { showClickOutToggle, showAppPromoToggle },
  } = useEligibility();

  const {
    classes: { adTypeSettingsHeader, settingsCheckboxContainer },
  } = useImmersiveAdsPageStyles();

  const adTypeToggleConfigs = useMemo(
    () => [
      {
        key: 'click-out',
        labelKey: 'Description.AdTypeClickOut',
        tooltipKey: 'Tooltip.AdTypeClickOut',
        fieldName: 'isClickOutEnabled' as keyof AdSettingsFormData,
        shouldRender: showClickOutToggle,
      },
      {
        key: 'app-promo',
        labelKey: 'Description.AdTypeAppPromo',
        tooltipKey: 'Tooltip.AdTypeAppPromo',
        fieldName: 'isAppPromoEnabled' as keyof AdSettingsFormData,
        shouldRender: showAppPromoToggle,
      },
    ],
    [showClickOutToggle, showAppPromoToggle],
  );

  if (adTypeToggleConfigs.every((config) => !config.shouldRender)) {
    return null;
  }

  return (
    <Accordion variant='outlined' defaultExpanded sx={{ width: '100%' }}>
      <AccordionSummary>
        <div className={adTypeSettingsHeader}>
          <Typography variant='h6'>
            {translate(translationKey('Label.AdType', TranslationNamespace.ImmersiveAdsAnalytics))}
          </Typography>
          <Typography variant='body2'>
            {translate(
              translationKey(
                'Description.AdTypeSettings',
                TranslationNamespace.ImmersiveAdsAnalytics,
              ),
            )}
          </Typography>
        </div>
      </AccordionSummary>
      <AccordionDetails>
        <div className={settingsCheckboxContainer}>
          {adTypeToggleConfigs
            .filter((config) => config.shouldRender)
            .map((config) => (
              <SettingsCheckboxRow
                key={config.key}
                labelTranslationKey={config.labelKey}
                tooltipTranslationKey={config.tooltipKey}
                fieldName={config.fieldName}
                control={control}
                disabled={disabled}
              />
            ))}
        </div>
      </AccordionDetails>
    </Accordion>
  );
};

export default AdTypeSettings;
