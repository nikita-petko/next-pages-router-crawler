import TranslationFeatureOptions from './enums/TranslationFeatureOptions';

export const characterNumberThreshold = 20;
export const hoverDelay = 100;
export const maxFileSizeMB = 4;
export const acceptedImageTypes = ['jpg', 'jpeg', 'png'];
export const iconResolutionWidth = 512;
export const iconResolutionHeight = 512;
export const toastDurationTime = 3000;
export const maxNumberOfGameToFetch = 10;
export const contributionReportFeatureKey = 'contribution-report';
export const localizationTranslationPath =
  '/dashboard/creations/experiences/[id]/localization/translation';
export const translationTabMap = {
  [TranslationFeatureOptions.GameInfo]: 'info',
  [TranslationFeatureOptions.GameStrings]: 'strings',
  [TranslationFeatureOptions.GameImages]: 'images',
  [TranslationFeatureOptions.GameProducts]: 'products',
};

// Reference for language categories found in:
// https://m2.material.io/design/typography/language-support.html#language-categories-reference
export const tallLanguages = new Set([
  'ar',
  'bn',
  'fa',
  'gu',
  'hi',
  'km',
  'kn',
  'ml',
  'my',
  'ne',
  'pa',
  'si',
  'ta',
  'te',
  'th',
  'ur',
  'vi',
]);
export const denseLanguages = new Set(['ja', 'ko', 'zh-hans', 'zh-hant']);
export const rtlLanguages = new Set(['ar']);
export const chineseSimplifiedLanguageCode = 'zh-hans';
export const entryListPageSize = 20;

// Sort/filter configuration shared by every translation surface's SorterAndFilter menu. Every
// surface (game strings, images, …) renders the same options, so the configuration lives here
// rather than being passed in by each consumer. Option values match the consumers' sort/filter
// enum values; label keys resolve against the translation namespaces the hosting container
// registers.
export const defaultSortingOption = 'Default';

export const sortOptions: ReadonlyArray<{ value: string; labelKey: string }> = [
  { value: 'Default', labelKey: 'Label.SortingOptionDefault' },
  { value: 'Alphabetical', labelKey: 'Label.SortingOptionAlphabetic' },
  { value: 'CreatedTime', labelKey: 'Label.SortingOptionRecency' },
];

export interface SharedFilterSection {
  titleKey: string;
  tooltipKey?: string;
  options: ReadonlyArray<{ value: string; labelKey: string }>;
}

export const filterSections: ReadonlyArray<SharedFilterSection> = [
  {
    titleKey: 'Title.FilterByCompletionStatus',
    options: [
      { value: 'Translated', labelKey: 'Label.SortingOptionTranslated' },
      { value: 'Untranslated', labelKey: 'Label.SortingOptionUntranslated' },
    ],
  },
  {
    titleKey: 'Title.FilterByTranslationType',
    options: [
      { value: 'AutomaticTranslated', labelKey: 'Label.SortingOptionAutomaticallyTranslated' },
      { value: 'UserTranslated', labelKey: 'Label.SortingOptionManuallyTranslated' },
    ],
  },
  {
    titleKey: 'Title.FilterByRecency',
    tooltipKey: 'Message.RecencyInfo',
    options: [
      { value: 'RecentlyAddedEntries', labelKey: 'Label.SortingOptionRecentlyAdded' },
      {
        value: 'RecentlyModifiedTranslations',
        labelKey: 'Label.SortingOptionRecentlyModifiedTranslations',
      },
    ],
  },
];

export const filterLabelKeyByValue: Record<string, string> = Object.fromEntries(
  filterSections.flatMap((section) =>
    section.options.map((option): [string, string] => [option.value, option.labelKey]),
  ),
);
