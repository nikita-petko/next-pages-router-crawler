import type { Locale } from '@rbx/intl';
import type { TranslationKeyToFormattedText } from '@modules/analytics-translations/types';
import type { TFormattingSpec } from './numberFormatters';
import { formatNumberWithSpec } from './numberFormatters';

const formatChartUnit = (
  value: number,
  formattingSpec: TFormattingSpec,
  translationDependencies: {
    locale: Locale;
    translate: TranslationKeyToFormattedText;
  },
) => {
  return formatNumberWithSpec(value, formattingSpec, translationDependencies);
};

export default formatChartUnit;
