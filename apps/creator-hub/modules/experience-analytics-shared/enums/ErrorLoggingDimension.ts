import { TranslationKey, translationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

export const ErrorLoggingDimensionOptions = ['Client', 'Server'] as const;
export type ErrorLoggingDimensionOption = (typeof ErrorLoggingDimensionOptions)[number];
export const ErrorSourceTranslationKeys: Record<ErrorLoggingDimensionOption, TranslationKey> = {
  Client: translationKey('Label.ClientSource', TranslationNamespace.Analytics),
  Server: translationKey('Label.ServerSource', TranslationNamespace.Analytics),
};
