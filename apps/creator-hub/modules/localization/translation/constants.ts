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
