import { FC, useMemo } from 'react';
import { Controller, useFormContext, useFormState } from 'react-hook-form';
import { Dropdown, Menu, MenuItem, TextInput } from '@rbx/foundation-ui';
import { translationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useRAQIV2TranslationDependencies } from '@modules/experience-analytics-shared';
import { getExperienceAlertFieldRegisterOptions } from '../../constants/experienceAlertFormFieldRules';
import AlertConditionMetricTypeahead from './AlertConditionMetricTypeahead';
import {
  getAlertEligibleMetrics,
  getConditionValueUnitDisplay,
} from '../../constants/alertFormConstants';
import { AlertConditionOperation } from '../../constants/types';
import type { ExperienceAlertFormValues } from '../../constants/types';

const OPERATION_SYMBOLS: Record<AlertConditionOperation, string> = {
  [AlertConditionOperation.Lt]: '<',
  [AlertConditionOperation.Lte]: '<=',
  [AlertConditionOperation.Gt]: '>',
  [AlertConditionOperation.Gte]: '>=',
  [AlertConditionOperation.Eq]: '=',
};

export type ExperienceAlertConditionFieldsProps = {
  metric: ExperienceAlertFormValues['metric'];
};

const ExperienceAlertConditionFields: FC<ExperienceAlertConditionFieldsProps> = ({ metric }) => {
  const { control } = useFormContext<ExperienceAlertFormValues>();
  const { translate } = useRAQIV2TranslationDependencies();
  const eligibleMetrics = useMemo(() => getAlertEligibleMetrics(), []);

  const { errors } = useFormState<ExperienceAlertFormValues>({
    control,
    name: ['metric', 'value'],
  });

  const metricRules = useMemo(
    () => getExperienceAlertFieldRegisterOptions('metric', translate),
    [translate],
  );
  const valueRules = useMemo(
    () => getExperienceAlertFieldRegisterOptions('value', translate),
    [translate],
  );

  return (
    <div className='flex flex-col gap-medium'>
      <span className='text-label-medium content-emphasis'>
        {translate(translationKey('Label.Condition', TranslationNamespace.ExperienceAlerts))} *
      </span>
      <div className='grid gap-medium medium:[grid-template-columns:5fr_2fr_5fr] medium:items-start'>
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
              label=''
              placeholder={translate(
                translationKey('Label.ExploreModeMetric', TranslationNamespace.Analytics),
              )}
              hasError={!!errors.metric}
              error={errors.metric?.message}
            />
          )}
        />

        <Controller
          name='operation'
          control={control}
          render={({ field }) => (
            <Dropdown
              size='Medium'
              placeholder={OPERATION_SYMBOLS[field.value]}
              value={field.value}
              onValueChange={(v) => field.onChange(v as AlertConditionOperation)}>
              <Menu>
                {Object.entries(OPERATION_SYMBOLS).map(([op, symbol]) => (
                  <MenuItem key={op} value={op} title={symbol} />
                ))}
              </Menu>
            </Dropdown>
          )}
        />

        <Controller
          name='value'
          control={control}
          rules={valueRules}
          render={({ field }) => (
            <TextInput
              {...field}
              label=''
              placeholder={translate(translationKey('Label.Value', TranslationNamespace.Analytics))}
              size='Medium'
              hasError={!!errors.value}
              error={errors.value?.message}
              trailingIconNode={
                <span className='text-body-medium content-muted'>
                  {getConditionValueUnitDisplay(metric, translate)}
                </span>
              }
            />
          )}
        />
      </div>
    </div>
  );
};

export default ExperienceAlertConditionFields;
