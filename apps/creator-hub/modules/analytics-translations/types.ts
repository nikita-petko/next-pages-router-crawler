import type { ReactNode } from 'react';
import type { AnalyticsTranslationNamespace } from '@rbx/creator-hub-analytics-config';
import type { UseTranslationResult } from '@rbx/intl';
import type { TranslationNamespace } from '@modules/miscellaneous/localization';

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

export type TUseTranslationResult = UseTranslationResult;
export type TUseTranslationTranslateFunction = TUseTranslationResult['translate'];
export type TUseTranslationTranslateHTMLFunction = TUseTranslationResult['translateHTML'];
export type TUseTranslationTranslateWithNamespaceFunction =
  TUseTranslationResult['translateWithNamespace'];
export type TUseTranslationTranslateWithNamespaceHTMLFunction =
  TUseTranslationResult['translateWithNamespaceHTML'];

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
  unwrappedContext: Pick<TWrappedUseTranslationResult, 'ready' | 'translate'>,
) => TPendingTranslationFunction;

export type TPendingHtmlTranslationFunction = (
  english: string,
  description: string,
  tKeyTodo: TranslationKey,
  tags?: Parameters<TUseTranslationTranslateHTMLFunction>[1],
  args?: Parameters<TUseTranslationTranslateHTMLFunction>[2],
) => ReactNode;

export type TPendingHtmlTranslationHelperFunction = (
  unwrappedContext: Pick<TWrappedUseTranslationResult, 'ready' | 'translateHTML'>,
) => TPendingHtmlTranslationFunction;

export type TWrappedUseTranslationResult = {
  ready: boolean;
  translate: TranslationKeyToFormattedText;
  translateHTML: TranslationKeyAndTagsToFormattedReactNode;
  translateWithNamespace: TUseTranslationTranslateWithNamespaceFunction;
  translateWithNamespaceHTML: TUseTranslationTranslateWithNamespaceHTMLFunction;
  tPendingTranslation: TPendingTranslationFunction;
  tPendingHtmlTranslation: TPendingHtmlTranslationFunction;
};

export enum TranslationKeyOrFormattedTextType {
  PredefinedTranslationKey = 'PredefinedTranslationKey',
  DynamicFormattedText = 'DynamicFormattedText',
}

export type TranslationKeyOrFormattedText =
  | { type: TranslationKeyOrFormattedTextType.PredefinedTranslationKey; key: TranslationKey }
  | { type: TranslationKeyOrFormattedTextType.DynamicFormattedText; text: FormattedText };
