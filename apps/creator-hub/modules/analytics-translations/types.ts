import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { AnalyticsTranslationNamespace } from '@rbx/creator-hub-analytics-config';
import { useTranslation } from '@rbx/intl';
import { ReactNode } from 'react';

export type TranslationKeyWithoutNamespace = {
  key: string;
  namespace: undefined;
};
export type TranslationKey =
  | {
      key: string;
      namespace: TranslationNamespace | AnalyticsTranslationNamespace;
    }
  | TranslationKeyWithoutNamespace;
export type FormattedText = string & { _ft: FormattedText };
export type TranslationKeyToFormattedText = (
  key: TranslationKey,
  args?: { [key: string]: string },
) => FormattedText;

export type TUseTranslationFn = typeof useTranslation;
export type TUseTranslationResult = ReturnType<typeof useTranslation>;
export type TUseTranslationTranslateFunction = TUseTranslationResult['translate'];
export type TUseTranslationTranslateHTMLFunction = TUseTranslationResult['translateHTML'];

export type TranslationKeyAndTagsToFormattedReactNode = (
  key: TranslationKey,
  tags?: Parameters<TUseTranslationTranslateHTMLFunction>[1],
  args?: Parameters<TUseTranslationTranslateHTMLFunction>[2],
) => ReactNode;

export type TPendingTranslationFunction = (
  english: string,
  description: string,
  tKeyTodo: TranslationKey,
  args?: Parameters<TUseTranslationTranslateFunction>[1],
) => FormattedText;

export type TPendingTranslationHelperFunction = (
  unwrappedContext: Omit<TWrappedUseTranslationResult, 'tPendingTranslation'>,
) => TPendingTranslationFunction;

export type TWrappedUseTranslationResult = {
  ready: boolean;
  translate: TranslationKeyToFormattedText;
  translateHTML: TranslationKeyAndTagsToFormattedReactNode;
  tPendingTranslation: TPendingTranslationFunction;
};

export enum TranslationKeyOrFormattedTextType {
  PredefinedTranslationKey = 'PredefinedTranslationKey',
  DynamicFormattedText = 'DynamicFormattedText',
}

export type TranslationKeyOrFormattedText =
  | { type: TranslationKeyOrFormattedTextType.PredefinedTranslationKey; key: TranslationKey }
  | { type: TranslationKeyOrFormattedTextType.DynamicFormattedText; text: FormattedText };
