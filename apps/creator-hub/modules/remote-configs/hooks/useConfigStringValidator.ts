import { useCallback } from 'react';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
// Import shared types
import type { Validator } from './validatorTypes';
import { ValidationError } from './validatorTypes';

const useConfigStringValidator = () => {
  const { translate } = useTranslationWrapper(useTranslation());

  const validateConfigStringValue: Validator<
    string,
    ValidationError.EmptyValue | ValidationError.ReachedMaxChars
  > = useCallback(
    ({ value, errorMessageOverrides }) => {
      if (value.trim().length === 0) {
        const error = ValidationError.EmptyValue;
        return {
          isValid: false,
          error,
          message: translate(
            errorMessageOverrides?.[error] ??
              translationKey(
                'Message.ExperimentCreation.VariantStringValueRequired',
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
            errorMessageOverrides?.[error] ??
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

  return validateConfigStringValue;
};

export default useConfigStringValidator;
