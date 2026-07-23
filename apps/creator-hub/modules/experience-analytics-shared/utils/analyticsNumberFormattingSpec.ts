import {
  RAQIV2AggregationType,
  RAQIV2Dimension,
  RAQIV2MetricDisplayConfig,
  RAQIV2MetricUnit,
  RAQIV2MetricValueType,
  RAQIV2UIMetricToAPIConfig,
  RAQIV2UIPseudoDimension,
  TRAQIV2Metric,
} from '@rbx/creator-hub-analytics-config';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  ChartSummaryType,
  NumberContext,
  NumberIcon,
  percentageFormattingSpec,
  TFormattingSpec,
} from '@modules/charts-generic';
import {
  FormattedText,
  translationKey,
  TranslationKey,
  TranslationKeyOrFormattedText,
  TranslationKeyOrFormattedTextType,
} from '@modules/analytics-translations';
import RAQIV2ChartSpec from '../types/RAQIV2ChartSpec';
import getMetricDisplayConfig from '../constants/AnalyticsMetricDisplayConfig';
import AnalyticsSpecialNumberFormatting from '../constants/AnalyticsSpecialNumberFormatting';
import type { MetricLike } from '../types/ComputedMetric';
import { assertAtomicMetric, isComputedMetric } from '../types/ComputedMetric';

export const MetricUnitDefaultSuffix: Partial<
  Record<
    RAQIV2MetricUnit,
    {
      defaultSuffix?: TranslationKey;
      longSuffix?: TranslationKey;
    }
  >
> = {
  [RAQIV2MetricUnit.Bytes]: {
    defaultSuffix: translationKey('Label.BytesSuffix', TranslationNamespace.Analytics),
  },
  [RAQIV2MetricUnit.Days]: {
    defaultSuffix: translationKey('Label.DaysSuffix', TranslationNamespace.Analytics),
  },
  [RAQIV2MetricUnit.Gigabytes]: {
    defaultSuffix: translationKey('Label.GigabytesSuffix', TranslationNamespace.Analytics),
  },
  [RAQIV2MetricUnit.Hours]: {
    defaultSuffix: translationKey('Label.HoursSuffix', TranslationNamespace.Analytics),
  },
  [RAQIV2MetricUnit.Kilobytes]: {
    defaultSuffix: translationKey('Label.KilobytesSuffix', TranslationNamespace.Analytics),
  },
  [RAQIV2MetricUnit.Megabytes]: {
    defaultSuffix: translationKey('Label.MegabytesSuffix', TranslationNamespace.Analytics),
  },
  [RAQIV2MetricUnit.Milliseconds]: {
    defaultSuffix: translationKey('Label.MillisecondsSuffix', TranslationNamespace.Analytics),
  },
  [RAQIV2MetricUnit.Minutes]: {
    defaultSuffix: translationKey('Label.MinsSuffix', TranslationNamespace.Analytics),
    longSuffix: translationKey('Label.MinutesSuffix', TranslationNamespace.Analytics),
  },
  [RAQIV2MetricUnit.Seconds]: {
    defaultSuffix: translationKey('Label.SecondsSuffix', TranslationNamespace.Analytics),
  },
};

export enum NumberVerbosity {
  None = 'none',
  ShortSuffix = 'shortSuffix',
  LongSuffix = 'longSuffix',
  Abbreviate = 'abbreviate',
}

export const getVerbosity = (
  metric: MetricLike<TRAQIV2Metric>,
  numberContext: NumberContext,
): NumberVerbosity => {
  const atomicMetric = assertAtomicMetric(metric);
  const metricDisplayConfig = RAQIV2MetricDisplayConfig[atomicMetric];
  if (metricDisplayConfig.valueType !== RAQIV2MetricValueType.Numeric) {
    throw new Error(`Metric ${atomicMetric} is not a numeric metric`);
  }
  const { unit } = metricDisplayConfig;
  if (unit === RAQIV2MetricUnit.Percentage01 || unit === RAQIV2MetricUnit.Percentage0100) {
    // Percentage metrics are never abbreviated
    return NumberVerbosity.None;
  }

  switch (numberContext) {
    case NumberContext.DataPoint:
      return NumberVerbosity.None;
    case NumberContext.TableDataPoint: {
      if (
        unit === RAQIV2MetricUnit.Hours ||
        unit === RAQIV2MetricUnit.Minutes ||
        unit === RAQIV2MetricUnit.Seconds
      ) {
        return NumberVerbosity.ShortSuffix;
      }
      return NumberVerbosity.None;
    }
    case NumberContext.ChartSummary: {
      if (unit === RAQIV2MetricUnit.Minutes || unit === RAQIV2MetricUnit.Number) {
        return NumberVerbosity.ShortSuffix;
      }
      return NumberVerbosity.LongSuffix;
    }
    case NumberContext.TabSummary: {
      return NumberVerbosity.ShortSuffix;
    }
    case NumberContext.CardSummary:
    case NumberContext.TableSummary: {
      // Special case in current table
      if (
        unit === RAQIV2MetricUnit.Hours ||
        unit === RAQIV2MetricUnit.Minutes ||
        unit === RAQIV2MetricUnit.Seconds ||
        unit === RAQIV2MetricUnit.Gigabytes
      ) {
        return NumberVerbosity.ShortSuffix;
      }
      return NumberVerbosity.Abbreviate;
    }
    case NumberContext.AchievementHeader: {
      return NumberVerbosity.None;
    }
    default: {
      const exhaustiveCheck: never = numberContext;
      throw new Error(`Unsupported context ${exhaustiveCheck}`);
    }
  }
};

export const MetricUnitNumberFormatterSettingOverride: Partial<
  Record<RAQIV2MetricUnit, Intl.NumberFormatOptions>
> = {
  [RAQIV2MetricUnit.Usd]: {
    currency: 'USD',
    style: 'currency',
  },
  // Ratio shown as percentage when metric is between 0 - 1
  [RAQIV2MetricUnit.Percentage01]: {
    style: 'percent',
  },
  // Percentage when metric is between 0 - 100
  [RAQIV2MetricUnit.Percentage0100]: {
    style: 'percent',
  },
};

export const scientificNotationThreshold = 1e12;
export const maxRequiredDecimalPrecision = 3;
export const robuxDecimalThreshold = 100; // special case for showing decimal for robux values <= 100

export type TNumberContextMetadata = {
  chartSpec: Pick<RAQIV2ChartSpec, 'filter'> | null;
  inRoundedComparisonChipContext?: boolean;
  chartSummaryType?: ChartSummaryType;
};

export type TAnalyticsNumberFormatterArgs = {
  metric: MetricLike<TRAQIV2Metric>;
  context: NumberContext;
  numberContextMetadata?: TNumberContextMetadata;
};

const getPrefix = (metric: MetricLike<TRAQIV2Metric>): TranslationKeyOrFormattedText | null => {
  const isInLuobuEnvironment = process.env.buildTarget === 'luobu';
  const atomicMetric = assertAtomicMetric(metric);
  const metricDisplayConfig = RAQIV2MetricDisplayConfig[atomicMetric];
  if (isInLuobuEnvironment && metricDisplayConfig.unit === RAQIV2MetricUnit.Robux) {
    // This relies on all our backend pipelines being calculated in RMB instead of Robux as well
    return {
      type: TranslationKeyOrFormattedTextType.DynamicFormattedText,
      text: '¥' as FormattedText,
    };
  }
  return null;
};

const getSuffix = (
  metric: MetricLike<TRAQIV2Metric>,
  verbosity: NumberVerbosity,
): TranslationKeyOrFormattedText | null => {
  const atomicMetric = assertAtomicMetric(metric);
  const metricDisplayConfig = RAQIV2MetricDisplayConfig[atomicMetric];
  if (verbosity === NumberVerbosity.ShortSuffix) {
    const suffix =
      metricDisplayConfig.suffix?.short ??
      MetricUnitDefaultSuffix[metricDisplayConfig.unit]?.defaultSuffix;
    if (suffix) {
      return {
        type: TranslationKeyOrFormattedTextType.PredefinedTranslationKey,
        key: suffix,
      };
    }
  }
  if (verbosity === NumberVerbosity.LongSuffix) {
    const suffix =
      metricDisplayConfig.suffix?.long ??
      MetricUnitDefaultSuffix[metricDisplayConfig.unit]?.longSuffix ??
      metricDisplayConfig.suffix?.short ??
      MetricUnitDefaultSuffix[metricDisplayConfig.unit]?.defaultSuffix;
    if (suffix) {
      return {
        type: TranslationKeyOrFormattedTextType.PredefinedTranslationKey,
        key: suffix,
      };
    }
  }
  return null;
};

const getIconForUnit = (unit: RAQIV2MetricUnit): NumberIcon | undefined => {
  // NOTE(shumingxu, 2025-07-16): We probably want a better principle on when to show icons. Will check with Phoebe on this.
  // But for now this preserves the existing behavior.
  const isInLuobuEnvironment = process.env.buildTarget === 'luobu';
  if (!isInLuobuEnvironment && unit === RAQIV2MetricUnit.Robux) {
    return NumberIcon.Robux;
  }
  return undefined;
};

const getChartSummaryOverrideFormattingSpec = (
  summaryType: ChartSummaryType,
): TFormattingSpec | undefined => {
  switch (summaryType) {
    case ChartSummaryType.QuotaPercentageUsage:
    case ChartSummaryType.GrowthRate:
      return percentageFormattingSpec;
    case ChartSummaryType.Average:
    case ChartSummaryType.Total:
    case ChartSummaryType.TotalAbsoluteValue:
    case ChartSummaryType.SinglePoint:
    case ChartSummaryType.TopBreakdown:
      // Continue with normal processing for these types
      return undefined;
    default: {
      const exhaustiveCheck: never = summaryType;
      throw new Error(`Unsupported summary type ${exhaustiveCheck}`);
    }
  }
};

const getComputedMetricVerbosity = (numberContext: NumberContext): NumberVerbosity => {
  switch (numberContext) {
    case NumberContext.CardSummary:
    case NumberContext.TableSummary:
      return NumberVerbosity.Abbreviate;
    case NumberContext.DataPoint:
    case NumberContext.TableDataPoint:
    case NumberContext.ChartSummary:
    case NumberContext.TabSummary:
    case NumberContext.AchievementHeader:
      return NumberVerbosity.None;
    default: {
      const exhaustiveCheck: never = numberContext;
      throw new Error(`Unsupported context ${exhaustiveCheck}`);
    }
  }
};

const getScalingFactor = (metric: MetricLike<TRAQIV2Metric>): number | undefined => {
  const metricDisplayConfig = getMetricDisplayConfig(assertAtomicMetric(metric));
  if (metricDisplayConfig.unit === RAQIV2MetricUnit.Percentage0100) {
    return 0.01;
  }
  return undefined;
};

export const AGGREGATION_TYPE_DECIMAL_PRECISION = 2;

const INTEGER_AGGREGATION_TYPES = new Set<RAQIV2AggregationType>([
  RAQIV2AggregationType.Count,
  RAQIV2AggregationType.CountUser,
]);

/**
 * For UI metrics that fan out by AggregationType (e.g. CustomEventsV2),
 * the backend config sets a single `decimalPrecision` that applies to all
 * aggregation types.  Count/CountUser are naturally whole numbers, but
 * Sum/Average/Min/Max produce decimals.  This helper returns the effective
 * decimal precision by inspecting the chart spec's filter for the selected
 * aggregation type.
 */
const getAggregationAwareDecimalPrecision = (
  metric: TRAQIV2Metric,
  configDecimalPrecision: number,
  chartSpec: Pick<RAQIV2ChartSpec, 'filter'> | null | undefined,
): number => {
  const apiConfig = RAQIV2UIMetricToAPIConfig[metric as keyof typeof RAQIV2UIMetricToAPIConfig];
  if (!apiConfig || apiConfig.dimension !== RAQIV2UIPseudoDimension.AggregationType) {
    return configDecimalPrecision;
  }

  const aggregationFilter = chartSpec?.filter?.find(
    (f) => f.dimension === RAQIV2UIPseudoDimension.AggregationType,
  );
  if (!aggregationFilter || aggregationFilter.values.length !== 1) {
    return configDecimalPrecision;
  }

  const aggregationType = aggregationFilter.values[0] as RAQIV2AggregationType;
  if (INTEGER_AGGREGATION_TYPES.has(aggregationType)) {
    return configDecimalPrecision;
  }

  return Math.max(configDecimalPrecision, AGGREGATION_TYPE_DECIMAL_PRECISION);
};

export const generateAnalyticsNumberFormattingSpec = ({
  metric,
  context,
  numberContextMetadata,
}: TAnalyticsNumberFormatterArgs): TFormattingSpec => {
  if (context === NumberContext.ChartSummary && numberContextMetadata?.chartSummaryType) {
    const chartSummaryOverrideFormattingSpec = getChartSummaryOverrideFormattingSpec(
      numberContextMetadata.chartSummaryType,
    );
    if (chartSummaryOverrideFormattingSpec) {
      return chartSummaryOverrideFormattingSpec;
    }
  }

  if (isComputedMetric(metric)) {
    const verbosity = getComputedMetricVerbosity(context);
    return {
      abbreviate: verbosity === NumberVerbosity.Abbreviate,
      numberFormatOptions: {
        minimumFractionDigits: 0,
        maximumFractionDigits: maxRequiredDecimalPrecision,
      },
    };
  }

  const metricDisplayConfig = getMetricDisplayConfig(metric);
  const verbosity = getVerbosity(metric, context);

  const {
    unit,
    specialNumberFormatting,
    decimalPrecision: configDecimalPrecision,
  } = metricDisplayConfig;

  const decimalPrecision = getAggregationAwareDecimalPrecision(
    assertAtomicMetric(metric),
    configDecimalPrecision,
    numberContextMetadata?.chartSpec,
  );

  const numberFormatOptions: Intl.NumberFormatOptions = {
    minimumFractionDigits: Math.min(decimalPrecision, maxRequiredDecimalPrecision),
    maximumFractionDigits: decimalPrecision,
    ...MetricUnitNumberFormatterSettingOverride[unit],
  };

  const prefix = getPrefix(metric);
  let suffix = getSuffix(metric, verbosity);

  if (specialNumberFormatting === AnalyticsSpecialNumberFormatting.InExperienceCurrency) {
    const getCurrencyNameFromChartSpec = (
      spec: Pick<RAQIV2ChartSpec, 'filter'> | null | undefined,
    ): string => {
      if (!spec) {
        return '';
      }
      const currencyFilterValue = spec.filter?.find(
        (f) => f.dimension === RAQIV2Dimension.CurrencyType,
      )?.values;
      if (currencyFilterValue?.length === 1) {
        return `${currencyFilterValue[0]}`;
      }
      return '';
    };
    const currencyName = getCurrencyNameFromChartSpec(numberContextMetadata?.chartSpec);
    if (verbosity === NumberVerbosity.ShortSuffix || verbosity === NumberVerbosity.LongSuffix) {
      suffix = {
        type: TranslationKeyOrFormattedTextType.DynamicFormattedText,
        text: currencyName as FormattedText,
      };
    } else {
      suffix = null;
    }
  }

  return {
    abbreviate: verbosity === NumberVerbosity.Abbreviate,
    prefix: prefix ?? undefined,
    suffix: suffix ?? undefined,
    numberFormatOptions,
    icon: getIconForUnit(unit),
    scalingFactor: getScalingFactor(metric),
  };
};
