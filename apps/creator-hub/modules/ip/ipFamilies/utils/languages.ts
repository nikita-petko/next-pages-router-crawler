import { Locale } from '@rbx/intl';

/**
 * List of languages used by Agreements Manager for setting up IP Families. Translation keys are in the CreatorDashboard.RightsPortal namespace.
 */
export const languages = [
  { code: 'all', translationKey: 'Label.All' },
  { code: Locale.English, translationKey: 'Label.English' },
  // below this line extracted from
  // https://roblox.atlassian.net/wiki/spaces/GC/pages/2703131208/Roblox+Language+Support+Summary
  { code: Locale.Arabic, translationKey: 'Label.Arabic' },
  {
    code: Locale.SimplifiedChinese,
    translationKey: 'Label.ChineseSimplified',
  },
  {
    code: Locale.TraditionalChinese,
    translationKey: 'Label.ChineseTraditional',
  },
  { code: Locale.French, translationKey: 'Label.French' },
  { code: Locale.German, translationKey: 'Label.German' },
  { code: Locale.Indonesian, translationKey: 'Label.Indonesian' },
  { code: Locale.Italian, translationKey: 'Label.Italian' },
  { code: Locale.Japanese, translationKey: 'Label.Japanese' },
  { code: Locale.Korean, translationKey: 'Label.Korean' },
  { code: Locale.Polish, translationKey: 'Label.Polish' },
  { code: Locale.BrazilPortuguese, translationKey: 'Label.BrazilPortuguese' },
  { code: Locale.Russian, translationKey: 'Label.Russian' },
  { code: Locale.Spanish, translationKey: 'Label.Spanish' },
  { code: Locale.Thai, translationKey: 'Label.Thai' },
  { code: Locale.Turkish, translationKey: 'Label.Turkish' },
  { code: Locale.Vietnamese, translationKey: 'Label.Vietnamese' },
];

/**
 * In addition to regular Locale, we also support 'all' as a language code for
 * language agnostic keywords.
 */
export type LanguageCode = Locale | 'all';

/**
 * Given language code, return translation key.
 */
export const getTranslationKeyFromLocale = (code: string) => {
  const language = languages.find((lang) => lang.code === code);
  return language ? language.translationKey : '';
};
