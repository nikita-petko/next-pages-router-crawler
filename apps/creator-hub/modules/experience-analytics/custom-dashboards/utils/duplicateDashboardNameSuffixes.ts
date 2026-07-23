import type { TWrappedUseTranslationResult } from '@modules/analytics-translations/types';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

export type DuplicateDashboardNameSuffixes = {
  readonly first: string;
  readonly numbered: (n: number) => string;
};

/**
 * Build localized duplicate-dashboard-name suffixes. Wire from
 * `CustomDashboardServiceProvider` (or tests) — not from raw English literals in
 * `suggestDefaultName`.
 */
export function createDuplicateDashboardNameSuffixes(
  translation: Pick<TWrappedUseTranslationResult, 'tPendingTranslation'>,
): DuplicateDashboardNameSuffixes {
  return {
    first: translation.tPendingTranslation(
      '(copy)',
      'Suffix appended to a duplicated dashboard name when the first copy is free; a leading space is added when concatenating with the base name',
      translationKey(
        'Label.CustomDashboards.DuplicateName.FirstSuffix',
        TranslationNamespace.Analytics,
      ),
    ),
    numbered: (n: number) =>
      translation.tPendingTranslation(
        '(copy {n})',
        'Suffix appended when a duplicate dashboard name collides; {n} is the disambiguation number (2, 3, …); a leading space is added when concatenating with the base name',
        translationKey(
          'Label.CustomDashboards.DuplicateName.NumberedSuffix',
          TranslationNamespace.Analytics,
        ),
        { n: String(n) },
      ),
  };
}

/**
 * Stable English suffixes for unit tests and the conformance harness. Production
 * service factories should pass `createDuplicateDashboardNameSuffixes(translate)`.
 */
export const testOnlyEnglishDuplicateDashboardNameSuffixes: DuplicateDashboardNameSuffixes = {
  first: '(copy)',
  numbered: (n: number) => `(copy ${n})`,
};
