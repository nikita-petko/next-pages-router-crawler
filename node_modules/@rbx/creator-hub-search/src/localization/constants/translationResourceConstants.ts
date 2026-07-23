// Stub file for translation resource constants
import { Locale } from '@rbx/intl';

export const availableDocsContentLocales: Locale[] = [
  Locale.English,
  Locale.Spanish,
  Locale.French,
  Locale.German,
  Locale.Italian,
  Locale.BrazilPortuguese,
  Locale.Korean,
  Locale.SimplifiedChinese,
  Locale.TraditionalChinese,
  Locale.Japanese,
];

export const defaultLocale = Locale.English;

export const LocaleByPathPrefix = new Map<string, Locale>([
  ['en-us', Locale.English],
  ['es-es', Locale.Spanish],
  ['fr-fr', Locale.French],
  ['de-de', Locale.German],
  ['it-it', Locale.Italian],
  ['pt-br', Locale.BrazilPortuguese],
  ['ko-kr', Locale.Korean],
  ['zh-cn', Locale.SimplifiedChinese],
  ['zh-tw', Locale.TraditionalChinese],
  ['ja-jp', Locale.Japanese],
]);
