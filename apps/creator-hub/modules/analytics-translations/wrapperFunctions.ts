import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { ReactNode } from 'react';
import {
  TUseTranslationResult,
  TranslationKey,
  FormattedText,
  TranslationKeyToFormattedText,
  TranslationKeyAndTagsToFormattedReactNode,
  TranslationKeyWithoutNamespace,
} from './types';

export const translationFn = (given: TUseTranslationResult): TranslationKeyToFormattedText => {
  const { translate } = given;
  return ({ key }: TranslationKey, args): FormattedText => {
    return translate(key, args) as FormattedText;
  };
};

export const translateHTMLFn = (
  given: TUseTranslationResult,
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
    return key as FormattedText;
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
  return str as FormattedText;
};
