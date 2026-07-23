import { useCallback } from 'react';
import { translationKey, useTranslationWrapper } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useTranslation } from '@rbx/intl';

// Import shared types
import type { Validator } from './validatorTypes';
import { ValidationError } from './validatorTypes';

const ValidBooleanValues: Readonly<Array<string>> = ['true', 'false'];

const useConfigBooleanValidator = () => {
  const { translate } = useTranslationWrapper(useTranslation());

  const validateConfigBooleanValue: Validator<string, ValidationError.InvalidBoolean> = useCallback(
    ({ value, errorMessageOverrides }) => {
      if (!ValidBooleanValues.includes(value)) {
        const error = ValidationError.InvalidBoolean;
        return {
          isValid: false,
          error,
          message: translate(
            errorMessageOverrides?.[error] ??
              translationKey(
                'Message.ExperimentCreation.VariantBooleanValueInvalid',
                TranslationNamespace.UniverseConfigAndExperimentation,
              ),
          ),
        };
      }

      return {
        isValid: true,
      };
    },
    [translate],
  );

  return validateConfigBooleanValue;
};

export default useConfigBooleanValidator;
