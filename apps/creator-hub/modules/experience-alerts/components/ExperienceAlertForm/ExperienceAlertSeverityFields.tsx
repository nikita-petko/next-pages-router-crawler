import { FC } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Radio, RadioGroup } from '@rbx/foundation-ui';
import { translationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useRAQIV2TranslationDependencies } from '@modules/experience-analytics-shared';
import { ExperienceAlertSeverity } from '../../constants/types';
import type { ExperienceAlertFormValues } from '../../constants/types';

const ExperienceAlertSeverityFields: FC = () => {
  const { control } = useFormContext<ExperienceAlertFormValues>();
  const { translate } = useRAQIV2TranslationDependencies();

  return (
    <div className='flex flex-col gap-medium'>
      <span className='text-label-medium content-emphasis'>
        {translate(translationKey('Label.Severity', TranslationNamespace.ExperienceAlerts))}
      </span>
      <Controller
        name='severity'
        control={control}
        render={({ field }) => (
          <RadioGroup value={field.value} onValueChange={field.onChange}>
            <Radio
              value={ExperienceAlertSeverity.Critical}
              label={translate(
                translationKey('Severity.Critical', TranslationNamespace.ExperienceAlerts),
              )}
            />
            <Radio
              value={ExperienceAlertSeverity.Medium}
              label={translate(
                translationKey('Severity.Medium', TranslationNamespace.ExperienceAlerts),
              )}
            />
            <Radio
              value={ExperienceAlertSeverity.Low}
              label={translate(
                translationKey('Severity.Low', TranslationNamespace.ExperienceAlerts),
              )}
            />
          </RadioGroup>
        )}
      />
    </div>
  );
};

export default ExperienceAlertSeverityFields;
