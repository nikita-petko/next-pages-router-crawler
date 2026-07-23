import { translationKey } from '@modules/analytics-translations';
import type {
  FormattedText,
  TranslationKeyToFormattedText,
} from '@modules/analytics-translations/types';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

const NS = TranslationNamespace.ExperienceAlerts;

export enum AlertFormValidationError {
  Required = 'Required',
  MaxLength = 'MaxLength',
  PositiveInteger = 'PositiveInteger',
  GranularityNotSupportedForMetric = 'GranularityNotSupportedForMetric',
  CategoriesMinOne = 'CategoriesMinOne',
  FilterDimensionNotSupportedForMetric = 'FilterDimensionNotSupportedForMetric',
  DurationMustExceedGranularity = 'DurationMustExceedGranularity',
}

export type AlertFormValidationErrorOptions = {
  /** Required when `error` is {@link AlertFormValidationError.MaxLength}. */
  max?: string;
  /** Required when `error` is {@link AlertFormValidationError.DurationMustExceedGranularity}. */
  minMinutes?: string;
};

export function getAlertFormValidationErrorMsg(
  error: AlertFormValidationError,
  translate: TranslationKeyToFormattedText,
  options?: AlertFormValidationErrorOptions,
): FormattedText {
  switch (error) {
    case AlertFormValidationError.Required:
      return translate(translationKey('Validation.Required', NS));
    case AlertFormValidationError.MaxLength: {
      const max = options?.max;
      if (max == null) {
        throw new Error('getAlertFormValidationErrorMsg(MaxLength) requires options.max');
      }
      return translate(translationKey('Validation.MaxLength', NS), { max });
    }
    case AlertFormValidationError.PositiveInteger:
      return translate(translationKey('Validation.PositiveInteger', NS));
    case AlertFormValidationError.GranularityNotSupportedForMetric:
      return translate(translationKey('Validation.GranularityNotSupportedForMetric', NS));
    case AlertFormValidationError.CategoriesMinOne:
      return translate(translationKey('Validation.CategoriesMinOne', NS));
    case AlertFormValidationError.FilterDimensionNotSupportedForMetric:
      return translate(translationKey('Validation.FilterDimensionNotSupportedForMetric', NS));
    case AlertFormValidationError.DurationMustExceedGranularity: {
      const minMinutes = options?.minMinutes;
      if (minMinutes == null) {
        throw new Error(
          'getAlertFormValidationErrorMsg(DurationMustExceedGranularity) requires options.minMinutes',
        );
      }
      return translate(translationKey('Validation.DurationMustExceedGranularity', NS), {
        minMinutes,
      });
    }
    default: {
      const exhaustive: never = error;
      throw new Error(`Unhandled AlertFormValidationError: ${exhaustive}`);
    }
  }
}
