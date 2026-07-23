import { Locale } from '@rbx/intl';
import { TranslationKeyToFormattedText } from '@modules/analytics-translations';
import {
  // eslint-disable-next-line deprecation/deprecation -- migration in progress. Will be removed in DSA-4660.
  formatNumber,
  formatNumberWithSpec,
  NumberContext,
  TFormattingSpec,
  TNumberContextMetadata,
} from './numberFormatters';
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
  // eslint-disable-next-line deprecation/deprecation -- migration in progress. Will be removed in DSA-4660.
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
