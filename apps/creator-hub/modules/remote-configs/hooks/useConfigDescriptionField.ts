import { useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import type { FormattedText } from '@modules/analytics-translations/types';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useConfigDescriptionValidator, {
  CONFIG_DESCRIPTION_MAX_CHARS,
} from './useConfigDescriptionValidator';

const DEFAULT_OPTIONAL_HELPER_TEXT_KEY = 'Dialog.CreateOrEdit.Helper.OptionalWithCharCount';
const PUBLISH_OPTIONAL_HELPER_TEXT_KEY = 'Dialog.Publish.Helper.OptionalWithCharCount';

export type ConfigDescriptionFieldState = {
  /** True when the description exceeds the max length. */
  isError: boolean;
  /** Validation message shown when over the limit; undefined when valid. */
  errorMessage: FormattedText | undefined;
  /** Character count display, e.g. "12/250". */
  charCount: FormattedText;
  /**
   * Combined helper text: a single localized string that conveys the error (when
   * invalid) or the "optional" helper copy (when valid), including the live
   * character count. Composed via interpolated translation keys rather than
   * string concatenation so translators control the full sentence.
   */
  helperText: FormattedText;
  /** The configured max length. */
  maxChars: number;
};

/**
 * Encapsulates config-description validation, character counting, and helper
 * text composition so description/changelog fields render consistently across
 * the web dialogs, the creation wizard, and the Studio webview.
 */
const useConfigDescriptionField = (
  value: string,
  options?: { optionalHelperTextKey?: string },
): ConfigDescriptionFieldState => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const validateConfigDescription = useConfigDescriptionValidator();
  const optionalHelperTextKey = options?.optionalHelperTextKey ?? DEFAULT_OPTIONAL_HELPER_TEXT_KEY;

  return useMemo(() => {
    const validationResult = validateConfigDescription({ value });
    const isError = !validationResult.isValid;
    const errorMessage = validationResult.isValid ? undefined : validationResult.message;
    const countArgs = {
      current: value.length.toString(),
      max: CONFIG_DESCRIPTION_MAX_CHARS.toString(),
    };

    const charCount = tPendingTranslation(
      '{current}/{max}',
      'Live character count for a config description field, e.g. "12/250".',
      translationKey(
        'Dialog.CreateOrEdit.Helper.CharCount',
        TranslationNamespace.UniverseConfigAndExperimentation,
      ),
      countArgs,
    );

    // The translation scanner only extracts string-literal keys, so the
    // caller-selected optional helper key is resolved through explicit literal
    // branches rather than an interpolated variable.
    const optionalHelperText =
      optionalHelperTextKey === PUBLISH_OPTIONAL_HELPER_TEXT_KEY
        ? tPendingTranslation(
            'Optional ({current}/{max})',
            'Helper text for an optional config description field, with live character count.',
            translationKey(
              'Dialog.Publish.Helper.OptionalWithCharCount',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
            countArgs,
          )
        : tPendingTranslation(
            'Optional ({current}/{max})',
            'Helper text for an optional config description field, with live character count.',
            translationKey(
              'Dialog.CreateOrEdit.Helper.OptionalWithCharCount',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
            countArgs,
          );

    const helperText = isError
      ? tPendingTranslation(
          'Character limit reached ({current}/{max})',
          'Helper text shown when a config description exceeds the maximum length, with character count.',
          translationKey(
            'Dialog.CreateOrEdit.Error.CharacterLimitWithCount',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
          countArgs,
        )
      : optionalHelperText;

    return {
      isError,
      errorMessage,
      charCount,
      helperText,
      maxChars: CONFIG_DESCRIPTION_MAX_CHARS,
    };
  }, [optionalHelperTextKey, tPendingTranslation, validateConfigDescription, value]);
};

export default useConfigDescriptionField;
