import type { TranslationKey } from '@modules/analytics-translations/types';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

export enum BenchmarkType {
  Similarity = 'Similarity',
  Genre = 'Genre',
  Platform = 'Platform',
}

export const benchmarkTypeToTranslationKey: Record<BenchmarkType, TranslationKey> = {
  [BenchmarkType.Similarity]: translationKey(
    'Label.BenchmarkSource.Similarity',
    TranslationNamespace.Analytics,
  ),
  [BenchmarkType.Genre]: translationKey(
    'Label.BenchmarkSource.Genre',
    TranslationNamespace.Analytics,
  ),
  [BenchmarkType.Platform]: translationKey(
    'Label.BenchmarkSource.Platform',
    TranslationNamespace.Analytics,
  ),
};
