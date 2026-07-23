import type { Locale } from '@rbx/intl';
import type { TranslationKeyToFormattedText } from '@modules/analytics-translations/types';
import type { TFormattingSpec, TNumberContextMetadata } from './numberFormatters';
// TODO(DSA-4660): Remove legacy formatNumber fallback after formatter migration.
import { formatNumber, formatNumberWithSpec, NumberContext } from './numberFormatters';
import { ChartUnit, ChartUnitAggregationType } from './types/ChartTypes';

const formatChartUnit = (
  value: number,
  spec: {
    unit?: ChartUnit;
    type?: ChartUnitAggregationType;
    context?: NumberContext;
    numberContextMetadata?: TNumberContextMetadata;
    formattingSpec?: TFormattingSpec;
  },
  translationDependencies: {
    locale: Locale;
    translate: TranslationKeyToFormattedText;
  },
) => {
  if (spec.formattingSpec) {
    return formatNumberWithSpec(value, spec.formattingSpec, translationDependencies);
  }
  // TODO(DSA-4660): Remove legacy formatNumber fallback after formatter migration.
  return formatNumber({
    value,
    unit: spec.unit ?? ChartUnit.Unknown,
    type: spec.type ?? ChartUnitAggregationType.Unknown,
    context: spec.context ?? NumberContext.DataPoint,
    locale: translationDependencies.locale,
    translate: translationDependencies.translate,
    numberContextMetadata: spec.numberContextMetadata,
  });
};

export default formatChartUnit;
