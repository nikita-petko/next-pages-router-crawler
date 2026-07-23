import React, { FC, useMemo } from 'react';
import { Control } from 'react-hook-form';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { translationKey, useTranslationWrapper } from '@modules/analytics-translations';
import { useTranslation } from '@rbx/intl';
import { Typography, Accordion, AccordionSummary, AccordionDetails } from '@rbx/ui';
import useImmersiveAdsPageStyles from '../pages/ImmersiveAdsPage.styles';
import SettingsCheckboxRow from './SettingsCheckboxRow';
import { AdSettingsFormData } from './interfaces';

export interface AdServingSettingsProps {
  control: Control<AdSettingsFormData>;
}

const AdServingSettings: FC<AdServingSettingsProps> = ({ control }) => {
  const { translate } = useTranslationWrapper(useTranslation());

  const {
    classes: { adTypeSettingsHeader, settingsCheckboxContainer },
  } = useImmersiveAdsPageStyles();

  const adServingToggleConfigs = useMemo(
    () => [
      {
        key: 'exclude-likely-payer',
        labelKey: 'Description.ExcludeLikelyPayerSettingsToggle',
        tooltipKey: 'Tooltip.ExcludeLikelyPayerSettingsToggle',
        fieldName: 'isExcludeLikelyPayersEnabled' as keyof AdSettingsFormData,
        shouldRender: true,
      },
    ],
    [],
  );

  return (
    <Accordion variant='outlined' defaultExpanded sx={{ width: '100%' }}>
      <AccordionSummary>
        <div className={adTypeSettingsHeader}>
          <Typography variant='h6'>
            {translate(
              translationKey(
                'Title.RewardedAdServingSettings',
                TranslationNamespace.ImmersiveAdsAnalytics,
              ),
            )}
          </Typography>
          <Typography variant='body2'>
            {translate(
              translationKey(
                'Description.RewardedAdServingSettings',
                TranslationNamespace.ImmersiveAdsAnalytics,
              ),
            )}
          </Typography>
        </div>
      </AccordionSummary>
      <AccordionDetails>
        <div className={settingsCheckboxContainer}>
          {adServingToggleConfigs
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

export default AdServingSettings;
