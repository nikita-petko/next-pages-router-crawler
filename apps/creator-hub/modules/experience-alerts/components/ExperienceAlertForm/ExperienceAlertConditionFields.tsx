import type { FC } from 'react';
import { useEffect, useMemo, useRef } from 'react';
import { Controller, useFormContext, useFormState, useWatch } from 'react-hook-form';
import { Dropdown, Menu, MenuItem, TextInput } from '@rbx/foundation-ui';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import {
  ALERT_COMPARISON_PERIOD_LABELS,
  ALERT_CONDITION_OPERATION_MENU_ORDER,
  ALERT_CONDITION_OPERATION_SYMBOLS,
  ALERT_EVALUATION_MODE_DESCRIPTION_KEYS,
  ALERT_EVALUATION_MODE_LABEL_KEYS,
  ALERT_EVALUATION_MODE_MENU_ORDER,
  isComparisonPeriodGranularity,
  type ComparisonPeriodGranularity,
} from '../../constants/alertFormConstants';
import { getExperienceAlertFieldRegisterOptions } from '../../constants/experienceAlertFormFieldRules';
import {
  AnalyticsAlertEvaluationMode,
  AnalyticsAlertInterval,
  type ExperienceAlertFormValues,
} from '../../constants/types';
import {
  AlertFormValidationError,
  getAlertFormValidationErrorMsg,
} from '../../constants/validationErrorMessages';
import {
  countDisplayValueDecimalPlaces,
  getAlertThresholdMaxDecimalPlaces,
  getAlertThresholdUnitDisplay,
  getComparisonPeriodGranularityOptions,
  parseAlertThresholdDisplayValueToRaw,
} from '../../utils/analyticsAlertFormUtils';

export type ExperienceAlertConditionFieldsProps = {
  metric: ExperienceAlertFormValues['metric'];
};

const ExperienceAlertConditionFields: FC<ExperienceAlertConditionFieldsProps> = ({ metric }) => {
  const { control, getValues, setValue } = useFormContext<ExperienceAlertFormValues>();
  const { translate } = useRAQIV2TranslationDependencies();

  const comparisonPeriodLabel = (granularity: ComparisonPeriodGranularity): string => {
    return translate(ALERT_COMPARISON_PERIOD_LABELS[granularity]);
  };

  const { errors, isSubmitted } = useFormState<ExperienceAlertFormValues>({
    control,
    name: ['value'],
  });

  // Watching here so the value-field's parser/unit-suffix re-evaluate when
  // the user toggles the evaluation-mode dropdown (PoP swaps the unit hint
  // to `%` and changes the parse strategy regardless of the metric).
  const evaluationMode = useWatch({ control, name: 'evaluationMode' });

  // The comparison-period options depend on the selected granularity: only units
  // >= the granularity (and supported by the metric) are offered, so re-derive
  // them whenever either changes.
  const interval = useWatch({ control, name: 'interval' });
  const comparisonPeriodOptions = useMemo((): ComparisonPeriodGranularity[] => {
    if (!metric || interval === '' || !isValidEnumValue(AnalyticsAlertInterval, interval)) {
      return [];
    }
    return getComparisonPeriodGranularityOptions(metric, interval);
  }, [metric, interval]);

  // Re-snap a chosen period-over-period comparison unit when the granularity is
  // raised above it (the unit drops out of the offered set), moving it to the new
  // smallest valid option. Never auto-picks when nothing is selected yet — the
  // user chooses the period explicitly. The ref guard skips the initial render so
  // a loaded alert's stored unit is preserved; `shouldValidate` keeps the
  // required error in sync after a re-snap.
  const prevComparisonDepsRef = useRef({ metric, interval, evaluationMode });
  useEffect(() => {
    const prev = prevComparisonDepsRef.current;
    if (
      prev.metric === metric &&
      prev.interval === interval &&
      prev.evaluationMode === evaluationMode
    ) {
      return;
    }
    prevComparisonDepsRef.current = { metric, interval, evaluationMode };

    if (
      evaluationMode !== AnalyticsAlertEvaluationMode.PeriodOverPeriod ||
      comparisonPeriodOptions.length === 0
    ) {
      return;
    }
    const current = getValues('comparisonPeriod');
    if (
      isComparisonPeriodGranularity(current) &&
      !comparisonPeriodOptions.some((option) => option === current)
    ) {
      setValue('comparisonPeriod', comparisonPeriodOptions[0], {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [metric, interval, evaluationMode, comparisonPeriodOptions, getValues, setValue]);

  // Placeholder progression for the comparison-period dropdown: prompt for the
  // metric, then the granularity, then the period, before showing the chosen unit.
  const comparisonPeriodPlaceholder = (
    value: ExperienceAlertFormValues['comparisonPeriod'],
  ): string => {
    if (!metric) {
      return translate(
        translationKey('Placeholder.SelectMetricFirst', TranslationNamespace.ExperienceAlerts),
      );
    }
    if (comparisonPeriodOptions.length === 0) {
      return translate(
        translationKey('Placeholder.SelectGranularityFirst', TranslationNamespace.ExperienceAlerts),
      );
    }
    if (!isComparisonPeriodGranularity(value)) {
      return translate(
        translationKey('Placeholder.SelectPeriod', TranslationNamespace.ExperienceAlerts),
      );
    }
    return comparisonPeriodLabel(value);
  };

  // The comparison period is required in period-over-period mode. Only enforced
  // once the metric and granularity are set (options non-empty); the metric and
  // granularity required errors cover those missing cases.
  const comparisonPeriodRules = useMemo(
    () => ({
      validate: {
        requiredForPeriodOverPeriod: (value: ExperienceAlertFormValues['comparisonPeriod']) => {
          if (
            evaluationMode !== AnalyticsAlertEvaluationMode.PeriodOverPeriod ||
            comparisonPeriodOptions.length === 0
          ) {
            return true;
          }
          return (
            isComparisonPeriodGranularity(value) ||
            getAlertFormValidationErrorMsg(AlertFormValidationError.Required, translate)
          );
        },
      },
    }),
    [evaluationMode, comparisonPeriodOptions.length, translate],
  );

  // Compose the base required-rule with a metric- and evaluation-mode-aware
  // parser check so the user sees an inline error for non-numeric input
  // (e.g. "abc"), matching what the API request builder would otherwise
  // reject at submit time. The parser also drives the form -> API value
  // transform; keeping validation here aligned with `buildCondition` keeps
  // the two in lockstep.
  const valueRules = useMemo(() => {
    const base = getExperienceAlertFieldRegisterOptions('value', translate);
    // `RegisterOptions.validate` is typed as either a single function or a
    // record of named validators. Our rule builder always produces the record
    // form (or leaves it undefined), so narrow before spreading to avoid the
    // `no-misused-spread` lint that fires on the function branch.
    const baseValidators = typeof base.validate === 'object' ? base.validate : undefined;
    return {
      ...base,
      validate: {
        ...baseValidators,
        parsesAsNumber: (rawInput: string) => {
          // Skip parsing when empty (the `required` validator owns that case)
          // or when no metric is selected yet (the metric field's own required
          // validator will surface that). PoP doesn't actually need the metric
          // for parsing, but gating both branches on it keeps the validator
          // simple and the metric-required error surfaces first anyway.
          if (rawInput == null || rawInput.trim() === '' || metric == null) {
            return true;
          }
          const parsed = parseAlertThresholdDisplayValueToRaw({
            metric,
            evaluationMode,
            displayValue: rawInput,
          });
          if (parsed === null) {
            return getAlertFormValidationErrorMsg(
              AlertFormValidationError.InvalidNumber,
              translate,
            );
          }
          return true;
        },
        decimalPrecisionWithinLimit: (rawInput: string) => {
          // Same empty / no-metric early-return as `parsesAsNumber`: the
          // `required` and metric-required validators own those cases.
          if (rawInput == null || rawInput.trim() === '' || metric == null) {
            return true;
          }
          const maxDecimals = getAlertThresholdMaxDecimalPlaces({ metric, evaluationMode });
          if (countDisplayValueDecimalPlaces(rawInput) <= maxDecimals) {
            return true;
          }
          return getAlertFormValidationErrorMsg(AlertFormValidationError.MaxDecimals, translate, {
            maxDecimals: String(maxDecimals),
          });
        },
      },
    };
  }, [evaluationMode, metric, translate]);

  const isPeriodOverPeriod = evaluationMode === AnalyticsAlertEvaluationMode.PeriodOverPeriod;

  // Absolute keeps the original 5-2-5 layout; period-over-period inserts the
  // comparison-period dropdown as a second column, widening the row to 4-4-2-3.
  const gridColumnsClass = isPeriodOverPeriod
    ? 'medium:[grid-template-columns:4fr_4fr_2fr_3fr]'
    : 'medium:[grid-template-columns:5fr_2fr_5fr]';

  return (
    <div className='flex flex-col gap-medium'>
      <span className='text-label-medium content-emphasis'>
        {translate(translationKey('Label.Condition', TranslationNamespace.ExperienceAlerts))} *
      </span>
      <div className={`grid gap-medium ${gridColumnsClass} medium:items-start`}>
        <Controller
          name='evaluationMode'
          control={control}
          render={({ field }) => (
            <Dropdown
              size='Medium'
              placeholder={translate(ALERT_EVALUATION_MODE_LABEL_KEYS[field.value])}
              value={field.value}
              onValueChange={(v) => field.onChange(v)}>
              <Menu>
                {ALERT_EVALUATION_MODE_MENU_ORDER.map((mode) => (
                  <MenuItem
                    key={mode}
                    value={mode}
                    title={translate(ALERT_EVALUATION_MODE_LABEL_KEYS[mode])}
                    description={translate(ALERT_EVALUATION_MODE_DESCRIPTION_KEYS[mode])}
                  />
                ))}
              </Menu>
            </Dropdown>
          )}
        />

        {isPeriodOverPeriod && (
          <Controller
            name='comparisonPeriod'
            control={control}
            rules={comparisonPeriodRules}
            render={({ field, fieldState }) => {
              const showError = !!fieldState.error && (fieldState.isTouched || isSubmitted);
              return (
                <Dropdown
                  size='Medium'
                  isDisabled={comparisonPeriodOptions.length === 0}
                  placeholder={comparisonPeriodPlaceholder(field.value)}
                  value={isComparisonPeriodGranularity(field.value) ? field.value : ''}
                  hasError={showError}
                  hint={showError ? fieldState.error?.message : undefined}
                  onOpenChange={(open) => {
                    if (!open) {
                      field.onBlur();
                    }
                  }}
                  onValueChange={(v) => field.onChange(v)}>
                  <Menu>
                    {comparisonPeriodOptions.map((period) => (
                      <MenuItem key={period} value={period} title={comparisonPeriodLabel(period)} />
                    ))}
                  </Menu>
                </Dropdown>
              );
            }}
          />
        )}

        <Controller
          name='operation'
          control={control}
          render={({ field }) => (
            <Dropdown
              size='Medium'
              placeholder={ALERT_CONDITION_OPERATION_SYMBOLS[field.value]}
              value={field.value}
              onValueChange={(v) => field.onChange(v)}>
              <Menu>
                {ALERT_CONDITION_OPERATION_MENU_ORDER.map((op) => (
                  <MenuItem key={op} value={op} title={ALERT_CONDITION_OPERATION_SYMBOLS[op]} />
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
                  {getAlertThresholdUnitDisplay(metric, evaluationMode, translate)}
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
