import { FC, useMemo } from 'react';
import { Controller, useFormContext, useFormState } from 'react-hook-form';
import { Dropdown, Menu, MenuItem } from '@rbx/foundation-ui';
import { translationKey } from '@modules/analytics-translations';
import { isValidEnumValue } from '@modules/miscellaneous/common/utils/enumUtils';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  RAQIV2MetricGranularity,
  RAQIV2MetricToSupportedGranularities,
} from '@rbx/creator-hub-analytics-config';
import {
  granularityLabels,
  useRAQIV2TranslationDependencies,
} from '@modules/experience-analytics-shared';
import { getExperienceAlertFieldRegisterOptions } from '../../constants/experienceAlertFormFieldRules';
import {
  AlertFormValidationError,
  getAlertFormValidationErrorMsg,
} from '../../constants/validationErrorMessages';
import type { ExperienceAlertFormValues } from '../../constants/types';

const NS = TranslationNamespace.ExperienceAlerts;

const withoutNone = (
  granularities: readonly RAQIV2MetricGranularity[],
): RAQIV2MetricGranularity[] => granularities.filter((g) => g !== RAQIV2MetricGranularity.None);

export type ExperienceAlertGranularityFieldProps = {
  metric: ExperienceAlertFormValues['metric'];
};

const ExperienceAlertGranularityField: FC<ExperienceAlertGranularityFieldProps> = ({ metric }) => {
  const { control } = useFormContext<ExperienceAlertFormValues>();
  const { translate } = useRAQIV2TranslationDependencies();
  const { isSubmitted } = useFormState({ control });

  const granularitiesInMenu = useMemo((): RAQIV2MetricGranularity[] => {
    if (!metric) return [];
    const supported = RAQIV2MetricToSupportedGranularities[metric];
    return supported ? withoutNone(supported) : [];
  }, [metric]);

  const rules = useMemo(() => {
    const baseRules = getExperienceAlertFieldRegisterOptions('timeGranularity', translate);
    return {
      ...baseRules,
      validate: {
        ...(baseRules.validate ? baseRules.validate : {}),
        supportedForMetric: (v: RAQIV2MetricGranularity | '') => {
          if (v === '' || !isValidEnumValue(RAQIV2MetricGranularity, v) || !metric) return true;
          return (
            granularitiesInMenu.includes(v) ||
            getAlertFormValidationErrorMsg(
              AlertFormValidationError.GranularityNotSupportedForMetric,
              translate,
            )
          );
        },
      },
    };
  }, [granularitiesInMenu, metric, translate]);

  return (
    <Controller
      name='timeGranularity'
      control={control}
      rules={rules}
      render={({ field, fieldState }) => {
        const dropdownValue =
          !metric || !field.value || !granularitiesInMenu.includes(field.value) ? '' : field.value;
        const showError = !!fieldState.error && (fieldState.isTouched || isSubmitted);

        return (
          <Dropdown
            key={metric ?? ''}
            label={`${translate(translationKey('Label.TimeGranularity', NS))} *`}
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
              if (!open) field.onBlur();
            }}
            onValueChange={(v) => {
              if (
                isValidEnumValue(RAQIV2MetricGranularity, v) &&
                v !== RAQIV2MetricGranularity.None &&
                granularitiesInMenu.includes(v)
              ) {
                field.onChange(v);
                field.onBlur();
              }
            }}>
            <Menu>
              {granularitiesInMenu.map((granularity) => (
                <MenuItem
                  key={granularity}
                  value={granularity}
                  title={
                    granularityLabels[granularity]
                      ? translate(granularityLabels[granularity])
                      : granularity
                  }
                />
              ))}
            </Menu>
          </Dropdown>
        );
      }}
    />
  );
};

export default ExperienceAlertGranularityField;
