import { Locale } from '@rbx/intl';

export const StringLocaleMap = new Map([
  ['id-id', Locale.Indonesian],
  ['de-de', Locale.German],
  ['en-us', Locale.English],
  ['es-es', Locale.Spanish],
  ['fr-fr', Locale.French],
  ['it-it', Locale.Italian],
  ['pl-pl', Locale.Polish],
  ['pt-br', Locale.BrazilPortuguese],
  ['vi-vn', Locale.Vietnamese],
  ['tr-tr', Locale.Turkish],
  ['th-th', Locale.Thai],
  ['zh-cn', Locale.SimplifiedChinese],
  ['zh-tw', Locale.TraditionalChinese],
  ['ja-jp', Locale.Japanese],
  ['ko-kr', Locale.Korean],
]);

// Order in availableDocsLocales will be the same as the Lang switcher dropdown
// This order follows the same on https://www.roblox.com/my/account#!/info
export const availableDocsLocales = [
  Locale.Indonesian,
  Locale.German,
  Locale.English,
  Locale.Spanish,
  Locale.French,
  Locale.Italian,
  Locale.Polish,
  Locale.BrazilPortuguese,
  Locale.Vietnamese,
  Locale.Turkish,
  Locale.Thai,
  Locale.SimplifiedChinese,
  Locale.TraditionalChinese,
  Locale.Japanese,
  Locale.Korean,
];
