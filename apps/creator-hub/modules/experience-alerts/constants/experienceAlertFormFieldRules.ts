import type { RegisterOptions, Validate } from 'react-hook-form';
import type { TranslationKeyToFormattedText } from '@modules/analytics-translations/types';
import type { ExperienceAlertFormValues } from './types';
import {
  AlertFormValidationError,
  getAlertFormValidationErrorMsg,
} from './validationErrorMessages';

export const EXPERIENCE_ALERT_NAME_MAX_LENGTH = 50;
export const EXPERIENCE_ALERT_DESCRIPTION_MAX_LENGTH = 200;

type AlertFieldRule = {
  required?: boolean;
  maxLength?: number;
  positiveInteger?: boolean;
};

const experienceAlertFormFieldRules: Partial<
  Record<keyof ExperienceAlertFormValues, AlertFieldRule>
> = {
  name: { required: true, maxLength: EXPERIENCE_ALERT_NAME_MAX_LENGTH },
  description: { maxLength: EXPERIENCE_ALERT_DESCRIPTION_MAX_LENGTH },
  metric: { required: true },
  value: { required: true },
  consecutiveOccurrences: { required: true, positiveInteger: true },
  interval: { required: true },
};

export function getExperienceAlertFieldRegisterOptions<F extends keyof ExperienceAlertFormValues>(
  field: F,
  translate: TranslationKeyToFormattedText,
): RegisterOptions<ExperienceAlertFormValues, F> {
  const def = experienceAlertFormFieldRules[field];
  if (!def) {
    throw new Error(`No validation rules configured for field "${field}"`);
  }

  const result: RegisterOptions<ExperienceAlertFormValues, F> = {};

  // Build named validators in an explicit `Record` so we never spread the
  // `validate` field's `Validate | Record | undefined` union (which would
  // hit `no-misused-spread` when the runtime value is a single function).
  const validators: Record<
    string,
    Validate<ExperienceAlertFormValues[F], ExperienceAlertFormValues>
  > = {};

  if (def.required) {
    // `Validate` narrows `v` to the field-specific type, so primitive
    // comparisons need `typeof` guards to remain legal for every field shape
    // (string vs. number vs. enum) the form contains.
    validators.required = (v) => {
      const isPresent =
        v != null &&
        (typeof v !== 'string' || v.trim() !== '') &&
        (typeof v !== 'number' || (v !== 0 && Number.isFinite(v))) &&
        (typeof v !== 'boolean' || v);
      return (
        isPresent || getAlertFormValidationErrorMsg(AlertFormValidationError.Required, translate)
      );
    };
  }

  if (def.maxLength != null) {
    result.maxLength = {
      value: def.maxLength,
      message: getAlertFormValidationErrorMsg(AlertFormValidationError.MaxLength, translate, {
        max: String(def.maxLength),
      }),
    };
  }

  if (def.positiveInteger) {
    validators.positiveInteger = (v) => {
      if (v === '' || v == null) {
        return true;
      }
      const n = typeof v === 'number' ? v : Number(v);
      if (!Number.isFinite(n) || n <= 0 || !Number.isInteger(n)) {
        return getAlertFormValidationErrorMsg(AlertFormValidationError.PositiveInteger, translate);
      }
      return true;
    };
  }

  if (Object.keys(validators).length > 0) {
    result.validate = validators;
  }

  return result;
}
