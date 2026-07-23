import EntryFilterOptions from './enums/EntryFilterOptions';
import EntrySortingOptions from './enums/EntrySortingOptions';

export const maxCharacterNumber = 750;
export const characterNumberThreshold = 20;
export const translationHistoryMaxCount = 10;
export const maxAllowedPatchEntriesBatchSize = 50;
export const maxAllowedTranslationsPerBatch = 250;
export const AutoTranslationAgent1 = 'Roblox';
export const AutoTranslationAgent2 = 'John Doe';
export const entryListPageSize = 20;
export const entryListLoadPageSize = 100;
export const numOfDaysForRecency = 7;
export const maxRetryTimes = 5;
export const placeHolderTableName = 'Unused Translation Table Name Placeholder';
export const sortingOptionsLabelMap: Record<EntrySortingOptions, string> = {
  [EntrySortingOptions.Default]: 'Label.SortingOptionDefault',
  [EntrySortingOptions.Alphabetical]: 'Label.SortingOptionAlphabetic',
  [EntrySortingOptions.CreatedTime]: 'Label.SortingOptionRecency',
};
export const filterOptionsLabelMap: Record<EntryFilterOptions, string> = {
  [EntryFilterOptions.Translated]: 'Label.SortingOptionTranslated',
  [EntryFilterOptions.Untranslated]: 'Label.SortingOptionUntranslated',
  [EntryFilterOptions.AutomaticTranslated]: 'Label.SortingOptionAutomaticallyTranslated',
  [EntryFilterOptions.UserTranslated]: 'Label.SortingOptionManuallyTranslated',
  [EntryFilterOptions.RecentlyAddedEntries]: 'Label.SortingOptionRecentlyAdded',
  [EntryFilterOptions.RecentlyModifiedTranslations]:
    'Label.SortingOptionRecentlyModifiedTranslations',
  [EntryFilterOptions.FeedbackAvailable]: 'Label.FeedbackAvailable',
  [EntryFilterOptions.NoFeedback]: 'Label.NoFeedback',
};
export const filterOptionsStringEnumMap: Record<string, EntryFilterOptions> = {
  Translated: EntryFilterOptions.Translated,
  Untranslated: EntryFilterOptions.Untranslated,
  AutomaticTranslated: EntryFilterOptions.AutomaticTranslated,
  UserTranslated: EntryFilterOptions.UserTranslated,
  RecentlyAddedEntries: EntryFilterOptions.RecentlyAddedEntries,
  RecentlyModifiedTranslations: EntryFilterOptions.RecentlyModifiedTranslations,
  FeedbackAvailable: EntryFilterOptions.FeedbackAvailable,
  NoFeedback: EntryFilterOptions.NoFeedback,
};
