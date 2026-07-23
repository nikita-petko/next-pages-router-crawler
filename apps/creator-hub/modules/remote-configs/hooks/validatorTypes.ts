import type { FormattedText, TranslationKey } from '@modules/analytics-translations';

// Consolidated ValidationError enum for all validators
export enum ValidationError {
  EmptyValue = 'EmptyValue',
  ReachedMaxChars = 'ReachedMaxChars',
  InvalidJson = 'InvalidJson',
  InvalidNumber = 'InvalidNumber',
  InvalidBoolean = 'InvalidBoolean',
  InvalidConfigKey = 'InvalidConfigKey',
}

export type ValidationResult<TError extends ValidationError> =
  | {
      isValid: true;
    }
  | {
      isValid: false;
      error: TError;
      message?: FormattedText;
    };

export type Validator<TValue, TError extends ValidationError> = ({
  value,
  errorMessageOverrides,
}: {
  value: TValue;
  errorMessageOverrides?: Partial<Record<TError, TranslationKey>>;
}) => ValidationResult<TError>;
