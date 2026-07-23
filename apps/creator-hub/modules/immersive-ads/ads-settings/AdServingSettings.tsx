import { useMemo } from 'react';
import type { Control } from 'react-hook-form';
import { useTranslation } from '@rbx/intl';
import { Typography, Accordion, AccordionSummary, AccordionDetails, Link } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { creatorHub } from '@modules/miscellaneous/urls';
import { HowToKey } from '../constants/calculatorTranslationKeys';
import useImmersiveAdsPageStyles from '../pages/ImmersiveAdsPage.styles';
import AdServingEnabledSettings from './AdServingEnabledSettings';
import type { AdSettingsFormData } from './interfaces';
import SettingsCheckboxRow from './SettingsCheckboxRow';

const { docs } = creatorHub;

const RewardedVideoDocLink = (chunks: React.ReactNode) => {
  return (
    <Link href={docs.getRewardedVideoUrl()} target='_blank' underline='always'>
      {chunks}
    </Link>
  );
};

interface AdServingSettingsProps {
  control: Control<AdSettingsFormData>;
  disabled?: boolean;
  servingEnabledToggleDisabled?: boolean;
}

const AdServingSettings = ({
  control,
  disabled = false,
  servingEnabledToggleDisabled = false,
}: AdServingSettingsProps) => {
  const { translate, translateHTML } = useTranslationWrapper(useTranslation());

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
          <Typography variant='body2' component='div'>
            {translate(
              translationKey(
                'Description.RewardedAdServingSettings',
                TranslationNamespace.ImmersiveAdsAnalytics,
              ),
            )}{' '}
            {translateHTML(HowToKey, [
              {
                opening: 'implementLinkStart',
                closing: 'implementLinkEnd',
                content: RewardedVideoDocLink,
              },
            ])}
          </Typography>
        </div>
      </AccordionSummary>
      <AccordionDetails>
        <div className={settingsCheckboxContainer}>
          <AdServingEnabledSettings control={control} disabled={servingEnabledToggleDisabled} />
          {adServingToggleConfigs
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

export default AdServingSettings;
