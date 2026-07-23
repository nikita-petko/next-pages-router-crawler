import { SeriesDataTypes } from '@rbx/analytics-ui';
import type {
  FormattedText,
  TranslationKeyToFormattedText,
} from '@modules/analytics-translations/types';
import { translationKeyWithoutNamespace } from '@modules/analytics-translations/wrapperFunctions';

const getTypeLegendDescription = (
  type: SeriesDataTypes,
  translate: TranslationKeyToFormattedText,
): FormattedText | null => {
  switch (type) {
    case SeriesDataTypes.Normal:
    case SeriesDataTypes.Total:
    case SeriesDataTypes.Scatter:
      return translate(translationKeyWithoutNamespace('Label.TypeLegendValidated'));
    case SeriesDataTypes.Projection:
      return translate(translationKeyWithoutNamespace('Label.TypeLegendUnvalidated'));
    case SeriesDataTypes.Benchmark:
      return translate(translationKeyWithoutNamespace('Label.TypeLegendBenchmark'));
    case SeriesDataTypes.Quota:
      return translate(translationKeyWithoutNamespace('Label.TypeLegendQuota'));
    case SeriesDataTypes.Comparison:
    case SeriesDataTypes.Noise:
      return null;
    default: {
      const exhaustiveCheck: never = type;
      throw new Error(`Unsupported chart type ${exhaustiveCheck}`);
    }
  }
};

export default getTypeLegendDescription;
