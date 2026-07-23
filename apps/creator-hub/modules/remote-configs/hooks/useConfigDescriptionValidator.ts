import { useCallback } from 'react';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { Validator } from './validatorTypes';
import { ValidationError } from './validatorTypes';

export const CONFIG_DESCRIPTION_MAX_CHARS = 250;

const useConfigDescriptionValidator = () => {
  const { translate } = useTranslationWrapper(useTranslation());

  const validateConfigDescription: Validator<string, ValidationError.ReachedMaxChars> = useCallback(
    ({ value, errorMessageOverrides }) => {
      if (value.length > CONFIG_DESCRIPTION_MAX_CHARS) {
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
              maxChars: CONFIG_DESCRIPTION_MAX_CHARS.toString(),
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

  return validateConfigDescription;
};

export default useConfigDescriptionValidator;
