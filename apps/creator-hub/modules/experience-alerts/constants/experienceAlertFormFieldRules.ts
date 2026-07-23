import type { RegisterOptions } from 'react-hook-form';
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
  durationMinutes: { required: true, positiveInteger: true },
  timeGranularity: { required: true },
};

export function getExperienceAlertFieldRegisterOptions<F extends keyof ExperienceAlertFormValues>(
  field: F,
  translate: TranslationKeyToFormattedText,
): RegisterOptions<ExperienceAlertFormValues, F> {
  const def = experienceAlertFormFieldRules[field];
  if (!def) throw new Error(`No validation rules configured for field "${field}"`);

  const result: RegisterOptions<ExperienceAlertFormValues, F> = {};

  if (def.required) {
    result.validate = {
      ...result.validate,
      required: (v: unknown) =>
        (!!v && String(v).trim() !== '') ||
        getAlertFormValidationErrorMsg(AlertFormValidationError.Required, translate),
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
    result.validate = {
      ...result.validate,
      positiveInteger: (v: unknown) => {
        if (v === '' || v == null) return true;
        const n = typeof v === 'number' ? v : Number(v);
        if (!Number.isFinite(n) || n <= 0 || !Number.isInteger(n)) {
          return getAlertFormValidationErrorMsg(
            AlertFormValidationError.PositiveInteger,
            translate,
          );
        }
        return true;
      },
    };
  }

  return result;
}
