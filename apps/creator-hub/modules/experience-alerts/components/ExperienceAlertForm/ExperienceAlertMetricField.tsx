import type { FC } from 'react';
import { useMemo } from 'react';
import { Controller, useFormContext, useFormState } from 'react-hook-form';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { getExperienceAlertFieldRegisterOptions } from '../../constants/experienceAlertFormFieldRules';
import type { ExperienceAlertFormValues } from '../../constants/types';
import { getAlertEligibleMetrics } from '../../utils/analyticsAlertFormUtils';
import AlertConditionMetricTypeahead from './AlertConditionMetricTypeahead';

const ExperienceAlertMetricField: FC = () => {
  const { control } = useFormContext<ExperienceAlertFormValues>();
  const { translate } = useRAQIV2TranslationDependencies();
  const eligibleMetrics = useMemo(() => getAlertEligibleMetrics(), []);

  const { errors } = useFormState<ExperienceAlertFormValues>({
    control,
    name: 'metric',
  });

  const metricRules = useMemo(
    () => getExperienceAlertFieldRegisterOptions('metric', translate),
    [translate],
  );

  return (
    <Controller
      name='metric'
      control={control}
      rules={metricRules}
      render={({ field }) => (
        <AlertConditionMetricTypeahead
          options={eligibleMetrics}
          value={field.value}
          onChange={field.onChange}
          onBlur={field.onBlur}
          label={`${translate(translationKey('Label.Metric', TranslationNamespace.Analytics))} *`}
          labelTooltip={{
            title: translate(translationKey('Label.Metric', TranslationNamespace.Analytics)),
            description: translate(
              translationKey('Tooltip.Metric', TranslationNamespace.ExperienceAlerts),
            ),
          }}
          placeholder={translate(
            translationKey('Label.ExploreModeMetric', TranslationNamespace.Analytics),
          )}
          hasError={!!errors.metric}
          error={errors.metric?.message}
        />
      )}
    />
  );
};

export default ExperienceAlertMetricField;
