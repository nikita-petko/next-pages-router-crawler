import type { FC } from 'react';
import { useMemo } from 'react';
import { Controller, useFormContext, useFormState } from 'react-hook-form';
import { Dropdown, Menu, MenuItem } from '@rbx/foundation-ui';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import granularityLabels from '@modules/experience-analytics-shared/constants/granularityLabels';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import { getExperienceAlertFieldRegisterOptions } from '../../constants/experienceAlertFormFieldRules';
import { AnalyticsAlertInterval, type ExperienceAlertFormValues } from '../../constants/types';
import {
  AlertFormValidationError,
  getAlertFormValidationErrorMsg,
} from '../../constants/validationErrorMessages';
import {
  analyticsIntervalOptionsForMetric,
  metricGranularityFromAnalyticsInterval,
} from '../../utils/analyticsAlertFormUtils';

const NS = TranslationNamespace.ExperienceAlerts;

export type ExperienceAlertGranularityFieldProps = {
  metric: ExperienceAlertFormValues['metric'];
};

const ExperienceAlertGranularityField: FC<ExperienceAlertGranularityFieldProps> = ({ metric }) => {
  const { control } = useFormContext<ExperienceAlertFormValues>();
  const { translate } = useRAQIV2TranslationDependencies();
  const { isSubmitted } = useFormState({ control });

  const intervalOptions = useMemo((): AnalyticsAlertInterval[] => {
    if (!metric) {
      return [];
    }
    return analyticsIntervalOptionsForMetric(metric);
  }, [metric]);

  const rules = useMemo(() => {
    const baseRules = getExperienceAlertFieldRegisterOptions('interval', translate);
    const baseValidators = typeof baseRules.validate === 'object' ? baseRules.validate : undefined;
    return {
      ...baseRules,
      validate: {
        ...baseValidators,
        supportedForMetric: (v: ExperienceAlertFormValues['interval']) => {
          if (v === '' || !metric) {
            return true;
          }
          if (!isValidEnumValue(AnalyticsAlertInterval, v)) {
            return getAlertFormValidationErrorMsg(
              AlertFormValidationError.GranularityNotSupportedForMetric,
              translate,
            );
          }
          return (
            intervalOptions.includes(v) ||
            getAlertFormValidationErrorMsg(
              AlertFormValidationError.GranularityNotSupportedForMetric,
              translate,
            )
          );
        },
      },
    };
  }, [intervalOptions, metric, translate]);

  return (
    <Controller
      name='interval'
      control={control}
      rules={rules}
      render={({ field, fieldState }) => {
        const dropdownValue =
          !metric || !field.value || !intervalOptions.includes(field.value) ? '' : field.value;
        const showError = !!fieldState.error && (fieldState.isTouched || isSubmitted);

        return (
          <Dropdown
            key={metric ?? ''}
            label={`${translate(translationKey('Label.TimeGranularity', NS))} *`}
            labelTooltip={{
              title: translate(translationKey('Label.TimeGranularity', NS)),
              description: translate(translationKey('Tooltip.Granularity', NS)),
            }}
            size='Medium'
            isDisabled={!metric}
            placeholder={translate(
              translationKey(
                metric ? 'Placeholder.SelectGranularity' : 'Placeholder.SelectMetricFirst',
                NS,
              ),
            )}
            value={dropdownValue}
            hasError={showError}
            hint={showError ? fieldState.error?.message : undefined}
            onOpenChange={(open) => {
              if (!open) {
                field.onBlur();
              }
            }}
            onValueChange={(v) => {
              if (isValidEnumValue(AnalyticsAlertInterval, v) && intervalOptions.includes(v)) {
                field.onChange(v);
                field.onBlur();
              }
            }}>
            <Menu>
              {intervalOptions.map((iv) => {
                const raqi = metricGranularityFromAnalyticsInterval(iv);
                return (
                  <MenuItem
                    key={iv}
                    value={iv}
                    title={granularityLabels[raqi] ? translate(granularityLabels[raqi]) : iv}
                  />
                );
              })}
            </Menu>
          </Dropdown>
        );
      }}
    />
  );
};

export default ExperienceAlertGranularityField;
