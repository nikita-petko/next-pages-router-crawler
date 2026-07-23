import React, { FC, useMemo } from 'react';
import { Control } from 'react-hook-form';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { translationKey, useTranslationWrapper } from '@modules/analytics-translations';
import { useTranslation } from '@rbx/intl';
import { Accordion, AccordionDetails, AccordionSummary, Typography } from '@rbx/ui';
import useImmersiveAdsPageStyles from '../pages/ImmersiveAdsPage.styles';
import SettingsCheckboxRow from './SettingsCheckboxRow';
import { AdSettingsFormData } from './interfaces';
import { useEligibility } from '../contexts';

export interface AdTypeSettingsProps {
  control: Control<AdSettingsFormData>;
}

const AdTypeSettings: FC<AdTypeSettingsProps> = ({ control }) => {
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
              />
            ))}
        </div>
      </AccordionDetails>
    </Accordion>
  );
};

export default AdTypeSettings;
