import { BenchmarkType } from '@rbx/client-universe-analytics-insights/v1';
import type { TranslationKeyToFormattedText } from '@modules/analytics-translations/types';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

export const getBenchmarkTypeDisplayName = (
  type: BenchmarkType,
  translate: TranslationKeyToFormattedText,
): string => {
  switch (type) {
    case BenchmarkType.Similarity:
      return translate(translationKey('Label.SimilarExperiences', TranslationNamespace.Insights));
    case BenchmarkType.Genre:
      return translate(translationKey('Label.Genre', TranslationNamespace.Insights));
    default:
      return type;
  }
};

export default {
  getBenchmarkTypeDisplayName,
};
