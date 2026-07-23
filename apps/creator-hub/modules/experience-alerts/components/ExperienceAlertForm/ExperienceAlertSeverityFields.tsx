import type { FC } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Radio, RadioGroup } from '@rbx/foundation-ui';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { AnalyticsAlertSeverity } from '../../constants/types';
import type { ExperienceAlertFormValues } from '../../constants/types';

const ExperienceAlertSeverityFields: FC = () => {
  const { control } = useFormContext<ExperienceAlertFormValues>();
  const { translate } = useRAQIV2TranslationDependencies();

  return (
    <Controller
      name='severity'
      control={control}
      render={({ field }) => (
        <RadioGroup
          groupLabel={`${translate(translationKey('Label.Severity', TranslationNamespace.ExperienceAlerts))} *`}
          labelTooltip={{
            title: translate(
              translationKey('Label.Severity', TranslationNamespace.ExperienceAlerts),
            ),
            description: translate(
              translationKey('Tooltip.Severity', TranslationNamespace.ExperienceAlerts),
            ),
          }}
          value={field.value}
          onValueChange={field.onChange}>
          <Radio
            value={AnalyticsAlertSeverity.SEV_0}
            label={translate(
              translationKey('Severity.Critical', TranslationNamespace.ExperienceAlerts),
            )}
          />
          <Radio
            value={AnalyticsAlertSeverity.SEV_1}
            label={translate(
              translationKey('Severity.Medium', TranslationNamespace.ExperienceAlerts),
            )}
          />
          <Radio
            value={AnalyticsAlertSeverity.SEV_2}
            label={translate(translationKey('Severity.Low', TranslationNamespace.ExperienceAlerts))}
          />
        </RadioGroup>
      )}
    />
  );
};

export default ExperienceAlertSeverityFields;
