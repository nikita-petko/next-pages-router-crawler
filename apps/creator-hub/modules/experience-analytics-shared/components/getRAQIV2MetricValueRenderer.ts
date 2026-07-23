import { FallbackValue, RAQIV2MetricValueType } from '@rbx/creator-hub-analytics-config';
import type { TRAQIV2UIMetric } from '@rbx/creator-hub-analytics-config';
import type { FormattedText, TranslationKey } from '@modules/analytics-translations/types';
import { getFallbackNoDataSeriesValue } from '@modules/charts-generic/charts/numberFormatters';
import logAnalyticsError from '@modules/charts-generic/utils/logAnalyticsError';
import mapMemoizeSingleParamFunction from '@modules/clients/utils/mapMemoizeSingleParamFunction';
import getAnalyticsMetricDisplayConfig, {
  RAQIV2MetricValueRendererType,
} from '../constants/AnalyticsMetricDisplayConfig';
import type { RAQIV2TranslationDependencies } from '../types/RAQIV2DimensionRenderer';

type RAQIV2NumericMetricValueRenderer = {
  type: RAQIV2MetricValueType.Numeric;
  getDisplayValue: (value: number | undefined) => number;
};

type RAQIV2StringArrayMetricValueRenderer = {
  type: RAQIV2MetricValueType.StringArray;
  getDisplayValue: (
    value: string[] | undefined,
    dependencies: RAQIV2TranslationDependencies,
  ) => FormattedText;
};

const buildStringArrayRenderer = (
  type: RAQIV2MetricValueRendererType,
  valueTranslationKeys: Record<string, { name: TranslationKey }>,
): RAQIV2StringArrayMetricValueRenderer => {
  let getDisplayValue: (
    value: string[] | undefined,
    dependencies: RAQIV2TranslationDependencies,
  ) => FormattedText;
  switch (type) {
    case RAQIV2MetricValueRendererType.WinningSegments: {
      getDisplayValue = (value, { translate }) => {
        if (!value?.length) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
          return 'N/A' as FormattedText;
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
        return value
          .map((segment) => {
            const key = valueTranslationKeys[segment];
            if (key) {
              return translate(key.name);
            }

            if (segment) {
              logAnalyticsError(`no translation for segment: ${segment}`);
            }
            return 'N/A';
          })
          .join(', ') as FormattedText;
      };
      break;
    }
    default: {
      const exhaustiveCheck: never = type;
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
      throw new Error(`Unknown string array renderer type: ${exhaustiveCheck}`);
    }
  }
  return {
    type: RAQIV2MetricValueType.StringArray,
    getDisplayValue,
  };
};

const build = (
  metric: TRAQIV2UIMetric,
): RAQIV2NumericMetricValueRenderer | RAQIV2StringArrayMetricValueRenderer => {
  const displayConfig = getAnalyticsMetricDisplayConfig(metric);
  const { valueType, noDataFallback } = displayConfig;
  switch (valueType) {
    case RAQIV2MetricValueType.Numeric: {
      const fallback = getFallbackNoDataSeriesValue(noDataFallback ?? FallbackValue.Zero);
      const defaultValue = fallback === 'N/A' ? Number.NaN : fallback;
      return {
        type: valueType,
        getDisplayValue: (value: number | undefined) => {
          return value ?? defaultValue;
        },
      };
    }
    case RAQIV2MetricValueType.StringArray: {
      if (!displayConfig.rendererType || !displayConfig.valueTranslationKeys) {
        throw new Error(`String array metric value renderer not implemented for metric ${metric}`);
      }
      return buildStringArrayRenderer(
        displayConfig.rendererType,
        displayConfig.valueTranslationKeys,
      );
    }
    case RAQIV2MetricValueType.String: {
      throw new Error(`String metric value renderer not implemented`);
    }
    default: {
      const exhaustiveCheck: never = valueType;
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
      throw new Error(`Unknown metric value type: ${exhaustiveCheck}`);
    }
  }
};

const getRAQIV2MetricValueRenderer = mapMemoizeSingleParamFunction(build);
export default getRAQIV2MetricValueRenderer;
