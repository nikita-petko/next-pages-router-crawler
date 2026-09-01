import { useCallback } from 'react';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { Validator } from './validatorTypes';
import { ValidationError } from './validatorTypes';

const conditionNameRegex = /^[A-Za-z][A-Za-z0-9]*$/;

const useConfigConditionNameValidator = () => {
  const { translate, tPendingTranslation } = useTranslationWrapper(useTranslation());

  const validateConfigConditionName: Validator<
    string,
    ValidationError.EmptyValue | ValidationError.InvalidConditionName
  > = useCallback(
    ({ value, errorMessageOverrides }) => {
      if (!value) {
        const error = ValidationError.EmptyValue;
        return {
          isValid: false,
          error,
          message: errorMessageOverrides?.[error]
            ? translate(errorMessageOverrides[error])
            : undefined,
        };
      }

      if (!conditionNameRegex.test(value)) {
        const error = ValidationError.InvalidConditionName;
        return {
          isValid: false,
          error,
          message: errorMessageOverrides?.[error]
            ? translate(errorMessageOverrides[error])
            : tPendingTranslation(
                'Condition name must start with a letter and contain only letters and numbers, with no spaces.',
                'Error message shown when a new targeting condition name contains invalid characters.',
                translationKey(
                  'Error.InvalidConditionName',
                  TranslationNamespace.UniverseConfigAndExperimentation,
                ),
              ),
        };
      }

      return {
        isValid: true,
      };
    },
    [tPendingTranslation, translate],
  );

  return validateConfigConditionName;
};

export default useConfigConditionNameValidator;
