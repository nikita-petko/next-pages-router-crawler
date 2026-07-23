import { useCallback } from 'react';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
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
