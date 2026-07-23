import { translationKey, TranslationKeyToFormattedText } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { BenchmarkType } from '@rbx/client-universe-analytics-insights/v1';

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
