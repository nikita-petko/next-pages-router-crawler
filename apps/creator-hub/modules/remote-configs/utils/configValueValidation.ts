import { ValidConfigEntryValueType } from '../api/universeConfigsClientEnums';
import { ValidationError, type ValidationResult } from '../hooks/validatorTypes';

type TValidateStringValue = (args: { value: string }) => ValidationResult<ValidationError>;
type TValidateBooleanValue = (args: { value: string }) => ValidationResult<ValidationError>;

type ValidateConfigValueParams = {
  overrideType: ValidConfigEntryValueType;
  stringValue: string;
  boolValue: 'true' | 'false';
  validateConfigStringValue: TValidateStringValue;
  validateConfigJsonValue: TValidateStringValue;
  validateConfigNumberValue: TValidateStringValue;
  validateConfigBooleanValue: TValidateBooleanValue;
};

type ShouldShowConfigValueErrorParams = {
  isEditing: boolean;
  valueValidation: ValidationResult<ValidationError>;
};

export const validateConfigValue = ({
  overrideType,
  stringValue,
  boolValue,
  validateConfigStringValue,
  validateConfigJsonValue,
  validateConfigNumberValue,
  validateConfigBooleanValue,
}: ValidateConfigValueParams): ValidationResult<ValidationError> => {
  switch (overrideType) {
    case ValidConfigEntryValueType.String:
      return validateConfigStringValue({ value: stringValue });
    case ValidConfigEntryValueType.Json:
      return validateConfigJsonValue({ value: stringValue });
    case ValidConfigEntryValueType.Number:
      return validateConfigNumberValue({ value: stringValue });
    case ValidConfigEntryValueType.Boolean:
      return validateConfigBooleanValue({ value: boolValue });
    default: {
      const exhaustiveCheck: never = overrideType;
      throw new Error(`Unexpected override type: ${exhaustiveCheck}`);
    }
  }
};

export const shouldShowConfigValueError = ({
  isEditing,
  valueValidation,
}: ShouldShowConfigValueErrorParams): boolean => {
  if (valueValidation.isValid) {
    return false;
  }
  if (!isEditing && valueValidation.error === ValidationError.EmptyValue) {
    return false;
  }
  return true;
};
