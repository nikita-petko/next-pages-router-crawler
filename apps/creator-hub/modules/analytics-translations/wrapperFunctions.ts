import type { ReactNode } from 'react';
import type { TranslationNamespace } from '@modules/miscellaneous/localization';
import type {
  TUseTranslationResult,
  TranslationKey,
  FormattedText,
  TranslationKeyToFormattedText,
  TranslationKeyAndTagsToFormattedReactNode,
  TranslationKeyWithoutNamespace,
} from './types';

export const translationFn = (
  given: Pick<TUseTranslationResult, 'translate'>,
): TranslationKeyToFormattedText => {
  const { translate } = given;
  return ({ key }: TranslationKey, args): FormattedText => {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- translate returns display-ready text; FormattedText is a compile-time brand.
    return translate(key, args) as FormattedText;
  };
};

export const translateHTMLFn = (
  given: Pick<TUseTranslationResult, 'translateHTML'>,
): TranslationKeyAndTagsToFormattedReactNode => {
  const { translateHTML } = given;
  return ({ key }: TranslationKey, tags, args): ReactNode => {
    return translateHTML(key, tags, args);
  };
};

/** Not good. Use translationKey() instead and include the namespace of the key. */
export const translationKeyWithoutNamespace = (key: string): TranslationKeyWithoutNamespace => {
  return { key, namespace: undefined };
};
export const translationKey = (key: string, namespace: TranslationNamespace): TranslationKey => {
  return { key, namespace };
};

/** This is probably better accomplished by the mock of useTranslation, but some tests need a function passed in. */
export const testOnlyFunctionThatStupidlyTurnsATranslationKeyIntoFormattedText: TranslationKeyToFormattedText =
  ({ key }) => {
    return brandUntranslatableText(key);
  };

/**
 * Brand intentionally untranslated display text as {@link FormattedText}.
 *
 * Prefer going through translations for user-facing copy. This helper is for
 * values that are display text by construction, such as number/date formatting
 * output or test fixture labels.
 */
export const brandUntranslatableText = (str: string): FormattedText => {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- FormattedText is a compile-time brand with no runtime constructor.
  return str as FormattedText;
};

/**
 * It is sometimes necessary, in a test, to be able to pass a FormattedText type into some component or function.
 * This allows us to do that. For ergonomics, suggest importing this like
 * ```
 * import { testOnlyFunctionThatStupidlyTurnsAStringIntoFormattedText as t } from '@modules/analytics-translations/wrapperFunctions';
 * ```
 *
 * It should almost never be necessary to explicitly cast some value ` as FormattedText` -- try not to do that. Known exceptions:
 * - number formatting
 * - date formatting
 */
export const testOnlyFunctionThatStupidlyTurnsAStringIntoFormattedText = (
  str: string,
): FormattedText => {
  return brandUntranslatableText(str);
};
