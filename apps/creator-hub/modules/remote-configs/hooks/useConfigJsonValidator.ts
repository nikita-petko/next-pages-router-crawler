import { useCallback } from 'react';
import { translationKey, useTranslationWrapper } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useTranslation } from '@rbx/intl';

// Import shared types
import type { Validator } from './validatorTypes';
import { ValidationError } from './validatorTypes';

const useConfigJsonValidator = () => {
  const { translate } = useTranslationWrapper(useTranslation());

  const validateConfigJsonValue: Validator<
    string,
    ValidationError.InvalidJson | ValidationError.EmptyValue | ValidationError.ReachedMaxChars
  > = useCallback(
    ({ value, errorMessageOverrides: errorMessageOverride }) => {
      if (!value.length) {
        const error = ValidationError.EmptyValue;
        return {
          isValid: false,
          error,
          message: translate(
            errorMessageOverride?.[error] ??
              translationKey(
                'Message.ExperimentCreation.VariantJsonValueRequired',
                TranslationNamespace.UniverseConfigAndExperimentation,
              ),
          ),
        };
      }

      try {
        JSON.parse(value);
      } catch {
        const error = ValidationError.InvalidJson;
        return {
          isValid: false,
          error,
          message: translate(
            errorMessageOverride?.[error] ??
              translationKey(
                'Dialog.CreateOrEdit.Error.InvalidJson',
                TranslationNamespace.UniverseConfigAndExperimentation,
              ),
          ),
        };
      }

      const maxChars = 100000;
      if (value.length > maxChars) {
        const error = ValidationError.ReachedMaxChars;
        return {
          isValid: false,
          error,
          message: translate(
            errorMessageOverride?.[error] ??
              translationKey(
                'Dialog.CreateOrEdit.Error.CharacterLimit',
                TranslationNamespace.UniverseConfigAndExperimentation,
              ),
            {
              maxChars: maxChars.toString(),
            },
          ),
        };
      }

      return {
        isValid: true,
      };
    },
    [translate],
  );

  return validateConfigJsonValue;
};

export default useConfigJsonValidator;
