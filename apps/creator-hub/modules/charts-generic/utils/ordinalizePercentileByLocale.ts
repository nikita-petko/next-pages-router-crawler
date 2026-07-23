import { Locale } from '@rbx/intl';

/**
 * The intl package does not support translating dynamic ordinal number yet. This function
 * provides a way to translate a single dynamic ordinal number to all of our supported locales.
 *
 * The plural rules are from https://www.unicode.org/cldr/charts/42/supplemental/language_plural_rules.html
 * and we are using the built-in API Intl.PluralRules since it's already widely available. So we don't need to
 * build these rules ourselves.
 *
 * Notice that this helper function is only grammatically correct when translating an ordinal number alone
 * rather then within a sentence.
 */
const ordinalizePercentileByLocale = (n: number, locale: Locale) => {
  const rule = new Intl.PluralRules(locale, { type: 'ordinal' }).select(n);

  switch (locale) {
    case Locale.English: {
      if (rule === 'one') {
        return `${n}st`;
      }
      if (rule === 'two') {
        return `${n}nd`;
      }
      if (rule === 'few') {
        return `${n}rd`;
      }
      return `${n}th`;
    }
    case Locale.French: {
      if (rule === 'one') {
        return `${n}re`;
      }
      return `${n}e`;
    }
    case Locale.Italian:
      return `${n}.ᵊ`;
    case Locale.Russian:
      return `${n}-й`;
    case Locale.Japanese:
      return `${n}番目`;
    case Locale.TraditionalChinese:
      return `第${n}號`;
    case Locale.BrazilPortuguese:
      return `${n}º`;
    case Locale.Korean:
      return `${n}번째`;
    case Locale.Spanish:
      return `${n}.ª`;
    case Locale.German:
      return `${n}.`;
    case Locale.SimplifiedChinese:
    case Locale.SimplifiedChineseJV:
      return `第${n}号`;
    case Locale.Arabic:
      return `الـ ${n}`;
    case Locale.Indonesian:
      return `ke-${n}`;
    case Locale.Polish:
    case Locale.Turkish:
      return `${n}.`;
    case Locale.Thai:
      return `ที่ ${n}`;
    case Locale.Vietnamese:
      return `thứ ${n}`;
    case Locale.Hindi:
      return `${n}वाँ`;
    default: {
      const exhaustiveCheck: never = locale;
      throw new Error(`Unknown ordinal number format for locale ${String(exhaustiveCheck)}`);
    }
  }
};

export default ordinalizePercentileByLocale;
