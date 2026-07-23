import { useCallback } from 'react';
import { translationKey, useTranslationWrapper } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useTranslation } from '@rbx/intl';

// Import shared types
import type { Validator } from './validatorTypes';
import { ValidationError } from './validatorTypes';

const useConfigKeyValidator = () => {
  const { translate } = useTranslationWrapper(useTranslation());

  const validateConfigKey: Validator<
    string,
    ValidationError.InvalidConfigKey | ValidationError.EmptyValue
  > = useCallback(
    ({ value, errorMessageOverrides }) => {
      if (!value) {
        const error = ValidationError.EmptyValue;
        return {
          isValid: false,
          error,
          message: translate(
            errorMessageOverrides?.[error] ??
              translationKey(
                'Message.ExperimentCreation.ConfigKeyRequired',
                TranslationNamespace.UniverseConfigAndExperimentation,
              ),
          ),
        };
      }
      // only allow letters, numbers, or the symbols ".", "-", "_" up to 256 characters.
      const isValidKey = /^[a-zA-Z0-9._-]{1,256}$/.test(value);
      if (!isValidKey) {
        const error = ValidationError.InvalidConfigKey;
        return {
          isValid: false,
          error,
          message: errorMessageOverrides?.[error]
            ? translate(errorMessageOverrides?.[error])
            : undefined,
        };
      }

      return {
        isValid: true,
      };
    },
    [translate],
  );

  return validateConfigKey;
};

export default useConfigKeyValidator;
