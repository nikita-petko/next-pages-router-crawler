import { FC, useMemo } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { TextInput } from '@rbx/foundation-ui';
import { translationKey } from '@modules/analytics-translations';
import { isValidEnumValue } from '@modules/miscellaneous/common/utils/enumUtils';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useRAQIV2TranslationDependencies } from '@modules/experience-analytics-shared';
import { RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import { getAlertGranularityStepMinutes } from '../../constants/alertFormConstants';
import { getExperienceAlertFieldRegisterOptions } from '../../constants/experienceAlertFormFieldRules';
import type { ExperienceAlertFormValues } from '../../constants/types';
import {
  AlertFormValidationError,
  getAlertFormValidationErrorMsg,
} from '../../constants/validationErrorMessages';

const ExperienceAlertDurationField: FC = () => {
  const { control, formState } = useFormContext<ExperienceAlertFormValues>();
  const { errors } = formState;
  const { translate } = useRAQIV2TranslationDependencies();
  const timeGranularity = useWatch({ control, name: 'timeGranularity' });

  const durationRules = useMemo(() => {
    const base = getExperienceAlertFieldRegisterOptions('durationMinutes', translate);
    return {
      ...base,
      validate: {
        ...(base.validate ? base.validate : {}),
        longerThanGranularity: (v: number | '') => {
          const n = Number(v);
          const g = timeGranularity;
          const stepMin = g ? getAlertGranularityStepMinutes(g) : 0;
          return (
            !Number.isFinite(n) ||
            !isValidEnumValue(RAQIV2MetricGranularity, g) ||
            stepMin <= 0 ||
            n >= stepMin ||
            getAlertFormValidationErrorMsg(
              AlertFormValidationError.DurationMustExceedGranularity,
              translate,
              { minMinutes: `${stepMin}` },
            )
          );
        },
      },
    };
  }, [timeGranularity, translate]);

  return (
    <Controller
      name='durationMinutes'
      control={control}
      rules={durationRules}
      render={({ field }) => (
        <TextInput
          label={translate(
            translationKey('Label.DurationMinutes', TranslationNamespace.ExperienceAlerts),
          )}
          isRequired
          placeholder={translate(
            translationKey('Placeholder.ValueExample', TranslationNamespace.ExperienceAlerts),
          )}
          size='Medium'
          value={field.value === '' ? '' : String(field.value)}
          onChange={(e) => {
            const t = e.target.value;
            if (t === '') {
              field.onChange('');
              return;
            }
            const n = Number(t);
            field.onChange(Number.isNaN(n) ? t : n);
          }}
          onBlur={field.onBlur}
          hasError={!!errors.durationMinutes}
          error={errors.durationMinutes?.message}
          helperText={translate(
            translationKey(
              'Description.DurationMinutesHelper',
              TranslationNamespace.ExperienceAlerts,
            ),
          )}
        />
      )}
    />
  );
};

export default ExperienceAlertDurationField;
