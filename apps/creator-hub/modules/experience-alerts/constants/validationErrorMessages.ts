import type {
  FormattedText,
  TranslationKeyToFormattedText,
} from '@modules/analytics-translations/types';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { AnalyticsAlertErrorCode } from '@modules/clients/analytics/analyticsAlertControlPlane';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

const NS = TranslationNamespace.ExperienceAlerts;

export enum AlertFormValidationError {
  Required = 'Required',
  MaxLength = 'MaxLength',
  PositiveInteger = 'PositiveInteger',
  InvalidNumber = 'InvalidNumber',
  MaxDecimals = 'MaxDecimals',
  GranularityNotSupportedForMetric = 'GranularityNotSupportedForMetric',
  CategoriesMinOne = 'CategoriesMinOne',
  FilterDimensionNotSupportedForMetric = 'FilterDimensionNotSupportedForMetric',
  OccurrencesMinForMinuteGranularity = 'OccurrencesMinForMinuteGranularity',
  OccurrencesMax = 'OccurrencesMax',
  TextFilterBlocked = 'TextFilterBlocked',
}

/**
 * Union of every error kind that {@link getAlertFormValidationErrorMsg} can
 * render — both client-side form validation errors and server-side error
 * codes returned by the analytics-alert-control-plane API.
 */
export type AlertFormErrorKind = AlertFormValidationError | AnalyticsAlertErrorCode;

export type AlertFormValidationErrorOptions = {
  /** Required when `error` is {@link AlertFormValidationError.MaxLength}. */
  max?: string;
  /** Required when `error` is {@link AlertFormValidationError.MaxDecimals}. */
  maxDecimals?: string;
  /** Required when `error` is {@link AlertFormValidationError.OccurrencesMinForMinuteGranularity}. */
  minCount?: string;
  /** Required when `error` is {@link AlertFormValidationError.OccurrencesMax}. */
  maxCount?: string;
};

export function getAlertFormValidationErrorMsg(
  error: AlertFormErrorKind,
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
    case AlertFormValidationError.InvalidNumber:
      return translate(translationKey('Validation.InvalidNumber', NS));
    case AlertFormValidationError.MaxDecimals: {
      const maxDecimals = options?.maxDecimals;
      if (maxDecimals == null) {
        throw new Error('getAlertFormValidationErrorMsg(MaxDecimals) requires options.maxDecimals');
      }
      return translate(translationKey('Validation.MaxDecimals', NS), { maxDecimals });
    }
    case AlertFormValidationError.GranularityNotSupportedForMetric:
      return translate(translationKey('Validation.GranularityNotSupportedForMetric', NS));
    case AlertFormValidationError.CategoriesMinOne:
      return translate(translationKey('Validation.CategoriesMinOne', NS));
    case AlertFormValidationError.FilterDimensionNotSupportedForMetric:
      return translate(translationKey('Validation.FilterDimensionNotSupportedForMetric', NS));
    case AlertFormValidationError.OccurrencesMinForMinuteGranularity: {
      const minCount = options?.minCount;
      if (minCount == null) {
        throw new Error(
          'getAlertFormValidationErrorMsg(OccurrencesMinForMinuteGranularity) requires options.minCount',
        );
      }
      return translate(translationKey('Validation.OccurrencesMinForMinuteGranularity', NS), {
        minCount,
      });
    }
    case AlertFormValidationError.OccurrencesMax: {
      const maxCount = options?.maxCount;
      if (maxCount == null) {
        throw new Error('getAlertFormValidationErrorMsg(OccurrencesMax) requires options.maxCount');
      }
      return translate(translationKey('Validation.OccurrencesMax', NS), {
        maxCount,
      });
    }
    case AnalyticsAlertErrorCode.TextFilterBlockedName:
    case AnalyticsAlertErrorCode.TextFilterBlockedDescription:
    case AlertFormValidationError.TextFilterBlocked:
      return translate(translationKey('Validation.TextFilterBlocked', NS));
    case AnalyticsAlertErrorCode.AlertNameExisted:
      return translate(translationKey('Error.AlertNameExisted', NS));
    case AnalyticsAlertErrorCode.MaxAlertReached:
      return translate(translationKey('Error.MaxAlertReached', NS));
    case AnalyticsAlertErrorCode.RequiredFieldMissing:
      return translate(translationKey('Error.RequiredFieldMissing', NS));
    case AnalyticsAlertErrorCode.InvalidFieldValue:
      return translate(translationKey('Error.InvalidFieldValue', NS));
    // The four codes below are part of the canonical
    // analytics-alert-control-plane contract but are not reachable
    // via the dashboard form in practice — `UNAUTHENTICATED` requires no
    // logged-in user, `PERMISSION_DENIED` is gated upstream on the page,
    // `ALERT_NOT_FOUND` only races a concurrent delete, and
    // `SERVICE_UNAVAILABLE` is a transient infra failure. They surface for
    // direct Open Cloud API consumers; in the form we collapse them into a
    // single generic "something went wrong" message rather than carrying
    // bespoke copy for each.
    case AnalyticsAlertErrorCode.Unauthenticated:
    case AnalyticsAlertErrorCode.PermissionDenied:
    case AnalyticsAlertErrorCode.AlertNotFound:
    case AnalyticsAlertErrorCode.ServiceUnavailable:
      return translate(translationKey('Error.Unknown', NS));
    default: {
      const exhaustive: never = error;
      throw new Error(`Unhandled AlertFormErrorKind: ${String(exhaustive)}`);
    }
  }
}
