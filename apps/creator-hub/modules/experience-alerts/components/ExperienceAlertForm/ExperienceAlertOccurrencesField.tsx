import type { FC } from 'react';
import { useMemo } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { TextInput } from '@rbx/foundation-ui';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  MAX_CONSECUTIVE_OCCURRENCES_FOR_MINUTE_GRANULARITY,
  MAX_CONSECUTIVE_OCCURRENCES_FOR_OTHER_GRANULARITY,
  MIN_CONSECUTIVE_OCCURRENCES_FOR_MINUTE_GRANULARITY,
} from '../../constants/alertFormConstants';
import { getExperienceAlertFieldRegisterOptions } from '../../constants/experienceAlertFormFieldRules';
import { AnalyticsAlertInterval, type ExperienceAlertFormValues } from '../../constants/types';
import {
  AlertFormValidationError,
  getAlertFormValidationErrorMsg,
} from '../../constants/validationErrorMessages';

/**
 * Numeric input for `consecutiveOccurrences` — the number of consecutive
 * evaluations the condition must be met before the alert fires. The control
 * plane translates this into the wall-clock duration via
 * `(consecutiveOccurrences - 1) * interval` at the API boundary.
 *
 * Cross-field validation depends on the selected interval:
 * - At one-minute granularity, the count must be in the inclusive range
 *   [{@link MIN_CONSECUTIVE_OCCURRENCES_FOR_MINUTE_GRANULARITY},
 *   {@link MAX_CONSECUTIVE_OCCURRENCES_FOR_MINUTE_GRANULARITY}]. The floor
 *   filters out single-minute spikes, and the ceiling caps the wall-clock
 *   evaluation window to keep firing latency understandable.
 * - At every other granularity (half-hour and above), the count must be in
 *   the inclusive range [1, {@link MAX_CONSECUTIVE_OCCURRENCES_FOR_OTHER_GRANULARITY}].
 *   The floor of 1 comes from the global `positiveInteger` rule.
 *
 * The placeholder copy also switches per granularity so the example value
 * matches the allowed range.
 */
const ExperienceAlertOccurrencesField: FC = () => {
  const { control, formState } = useFormContext<ExperienceAlertFormValues>();
  const { errors } = formState;
  const { translate } = useRAQIV2TranslationDependencies();
  const interval = useWatch({ control, name: 'interval' });

  const isMinuteGranularity = interval === AnalyticsAlertInterval.OneMinute;
  const maxOccurrences = isMinuteGranularity
    ? MAX_CONSECUTIVE_OCCURRENCES_FOR_MINUTE_GRANULARITY
    : MAX_CONSECUTIVE_OCCURRENCES_FOR_OTHER_GRANULARITY;

  const rules = useMemo(() => {
    const base = getExperienceAlertFieldRegisterOptions('consecutiveOccurrences', translate);
    // `RegisterOptions['validate']` is a union of either a single validator function
    // or a `Record<string, Validator>`. The shared rule builder always emits the
    // record form for `consecutiveOccurrences`, so narrow to it here so the spread
    // below is well-defined regardless of how the union is currently typed.
    const baseValidate =
      typeof base.validate === 'object' && base.validate !== null ? base.validate : {};
    return {
      ...base,
      validate: {
        ...baseValidate,
        minForMinuteGranularity: (v: number | '') => {
          if (!isMinuteGranularity) {
            return true;
          }
          const n = typeof v === 'number' ? v : Number(v);
          if (!Number.isFinite(n) || n >= MIN_CONSECUTIVE_OCCURRENCES_FOR_MINUTE_GRANULARITY) {
            return true;
          }
          return getAlertFormValidationErrorMsg(
            AlertFormValidationError.OccurrencesMinForMinuteGranularity,
            translate,
            { minCount: `${MIN_CONSECUTIVE_OCCURRENCES_FOR_MINUTE_GRANULARITY}` },
          );
        },
        maxForGranularity: (v: number | '') => {
          if (v === '' || v == null) {
            return true;
          }
          const n = typeof v === 'number' ? v : Number(v);
          // Defer to the `positiveInteger` validator for non-numeric / non-integer
          // input — it already produces the canonical message for those cases.
          if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) {
            return true;
          }
          if (n <= maxOccurrences) {
            return true;
          }
          return getAlertFormValidationErrorMsg(
            AlertFormValidationError.OccurrencesMax,
            translate,
            { maxCount: `${maxOccurrences}` },
          );
        },
      },
    };
  }, [isMinuteGranularity, maxOccurrences, translate]);

  const placeholderKey = isMinuteGranularity
    ? translationKey(
        'Placeholder.ConsecutiveOccurrences.Minute',
        TranslationNamespace.ExperienceAlerts,
      )
    : translationKey(
        'Placeholder.ConsecutiveOccurrences.Other',
        TranslationNamespace.ExperienceAlerts,
      );

  return (
    <Controller
      name='consecutiveOccurrences'
      control={control}
      rules={rules}
      render={({ field }) => (
        <TextInput
          label={translate(
            translationKey('Label.ConsecutiveOccurrences', TranslationNamespace.ExperienceAlerts),
          )}
          labelTooltip={{
            title: translate(
              translationKey(
                'Label.ConsecutiveOccurrencesShort',
                TranslationNamespace.ExperienceAlerts,
              ),
            ),
            description: translate(
              translationKey(
                'Tooltip.ConsecutiveOccurrences',
                TranslationNamespace.ExperienceAlerts,
              ),
            ),
          }}
          isRequired
          placeholder={translate(placeholderKey)}
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
          hasError={!!errors.consecutiveOccurrences}
          error={errors.consecutiveOccurrences?.message}
        />
      )}
    />
  );
};

export default ExperienceAlertOccurrencesField;
