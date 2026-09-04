import type { TTranslationKey } from '@rbx/intl';
import { ReasonType } from '@modules/clients/feedback';
import type { TranslationNamespace } from '@modules/miscellaneous/localization';

export const entryListPageSize = 20;

/** Feature name passed to the locale service to fetch image-translation-eligible locales. */
export const imageTranslationFeatureName = 'image-translation';

/** Destination for the "Learn more" button on the not-enabled empty state. */
export const imageTranslationLearnMoreUrl =
  'https://create.roblox.com/docs/production/localization/automatic-translations';

/** Max retries per page when recursively fetching the asset-entries table. Mirrors strings. */
export const maxRetryTimes = 5;

/** Max number of translation-history records to fetch per entry. Mirrors strings. */
export const translationHistoryMaxCount = 10;

/** Recency window (in days) for the "recently added/modified" filters. Mirrors strings. */
export const numOfDaysForRecency = 7;

/**
 * Single-select reasons shown in the image-translation feedback dialog, in display order.
 * `ReasonType.Invalid` (0) is intentionally omitted — it is not a user-selectable reason.
 * `labelKey` is a GameImageTranslation translation key resolved at render time (never raw copy).
 */
export const imageTranslationFeedbackReasons: {
  id: string;
  labelKey: TTranslationKey<typeof TranslationNamespace.GameImageTranslation>;
  reasonType: ReasonType;
}[] = [
  {
    id: 'untranslated',
    labelKey: 'Label.FeedbackReasonUntranslated',
    reasonType: ReasonType.Untranslated,
  },
  { id: 'accuracy', labelKey: 'Label.FeedbackReasonInaccurate', reasonType: ReasonType.Inaccurate },
  {
    id: 'grammar',
    labelKey: 'Label.FeedbackReasonSpellingGrammar',
    reasonType: ReasonType.SpellingOrGrammar,
  },
  {
    id: 'inappropriate',
    labelKey: 'Label.FeedbackReasonInappropriate',
    reasonType: ReasonType.Inappropriate,
  },
  {
    id: 'quality',
    labelKey: 'Label.FeedbackReasonImageQuality',
    reasonType: ReasonType.ImageQuality,
  },
];
