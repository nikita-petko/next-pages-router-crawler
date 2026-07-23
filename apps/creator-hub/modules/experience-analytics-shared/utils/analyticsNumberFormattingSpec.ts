import type { TRAQIV2Metric, TRAQIV2UIMetricToAPIConfig } from '@rbx/creator-hub-analytics-config';
import {
  RAQIV2AggregationType,
  RAQIV2Dimension,
  RAQIV2MetricUnit,
  RAQIV2MetricValueType,
  RAQIV2UIMetricToAPIConfig,
  RAQIV2UIPseudoDimension,
} from '@rbx/creator-hub-analytics-config';
import {
  type FormattedText,
  type TranslationKey,
  type TranslationKeyOrFormattedText,
  TranslationKeyOrFormattedTextType,
} from '@modules/analytics-translations/types';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type { TFormattingSpec } from '@modules/charts-generic/charts/numberFormatters';
import { NumberContext, NumberIcon } from '@modules/charts-generic/charts/numberFormatters';
import { percentageFormattingSpec } from '@modules/charts-generic/constants/analyticsNumberFormattingSpec';
import ChartSummaryType from '@modules/charts-generic/enums/ChartSummaryType';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import getMetricDisplayConfig, {
  isRAQIV2UIMetric,
} from '../constants/AnalyticsMetricDisplayConfig';
import AnalyticsSpecialNumberFormatting from '../constants/AnalyticsSpecialNumberFormatting';
import type { AtomicMetricLike, ComputedMetric, MetricLike } from '../types/ComputedMetric';
import {
  getUIMetricFromAtomicMetricLike,
  isComputedMetric,
  isCustomEventsAtomicMetricLike,
} from '../types/ComputedMetric';
import type RAQIV2ChartSpec from '../types/RAQIV2ChartSpec';

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
  metric: TRAQIV2Metric,
  numberContext: NumberContext,
): NumberVerbosity => {
  const metricDisplayConfig = getMetricDisplayConfig(metric);
  if (metricDisplayConfig.valueType !== RAQIV2MetricValueType.Numeric) {
    throw new Error(`Metric ${metric} is not a numeric metric`);
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
      throw new Error(`Unsupported context ${exhaustiveCheck as string}`);
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

const getPrefix = (metric: TRAQIV2Metric): TranslationKeyOrFormattedText | null => {
  const isInLuobuEnvironment = process.env.buildTarget === 'luobu';
  const metricDisplayConfig = getMetricDisplayConfig(metric);
  if (isInLuobuEnvironment && metricDisplayConfig.unit === RAQIV2MetricUnit.Robux) {
    // This relies on all our backend pipelines being calculated in RMB instead of Robux as well
    return {
      type: TranslationKeyOrFormattedTextType.DynamicFormattedText,
      // oxlint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      text: '¥' as FormattedText,
    };
  }
  return null;
};

const getSuffix = (
  metric: TRAQIV2Metric,
  verbosity: NumberVerbosity,
): TranslationKeyOrFormattedText | null => {
  const metricDisplayConfig = getMetricDisplayConfig(metric);
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
    case ChartSummaryType.LastValue:
      // Continue with normal processing for these types
      return undefined;
    default: {
      const exhaustiveCheck: never = summaryType;
      throw new Error(`Unsupported summary type ${exhaustiveCheck as string}`);
    }
  }
};

/**
 * A "pure L7 smoothing" ComputedMetric is a single-source identity formula
 * (`{ sources: [{ key: K, metric }], formula: K, l7Smoothing: true }`)
 * produced by `buildL7SmoothingComputedMetric` for metrics without a
 * pre-computed L7 counterpart. Its output is unitarily the rolling average
 * of one underlying metric, so it should render with that metric's units
 * and formatting (Robux icon, percentage scaling, decimal precision,
 * suffix, etc.) rather than the neutral computed-metric fallback used for
 * arbitrary equations.
 */
const isPureL7SmoothingComputedMetric = (metric: ComputedMetric): boolean => {
  if (!metric.l7Smoothing || metric.sources.length !== 1) {
    return false;
  }
  return metric.formula.trim() === metric.sources[0].key;
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
      throw new Error(`Unsupported context ${exhaustiveCheck as string}`);
    }
  }
};

const getScalingFactor = (metric: TRAQIV2Metric): number | undefined => {
  const metricDisplayConfig = getMetricDisplayConfig(metric);
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

const hasUIMetricApiConfig = (
  metric: TRAQIV2Metric,
): metric is keyof typeof RAQIV2UIMetricToAPIConfig =>
  isRAQIV2UIMetric(metric) && metric in RAQIV2UIMetricToAPIConfig;

const lookupUIMetricApiConfig = (metric: TRAQIV2Metric): TRAQIV2UIMetricToAPIConfig | undefined =>
  hasUIMetricApiConfig(metric) ? RAQIV2UIMetricToAPIConfig[metric] : undefined;

/**
 * For UI metrics that fan out by AggregationType (e.g. CustomEventsV2),
 * the backend config sets a single `decimalPrecision` that applies to all
 * aggregation types.  Count/CountUser are naturally whole numbers, but
 * Sum/Average/Min/Max produce decimals.  This helper returns the effective
 * decimal precision by inspecting either the atomic metric's structured
 * `aggregationType` field (post-DSA-5755, where source identity is hoisted
 * onto the atomic) or, as a fallback, the chart spec's filter for the
 * selected aggregation type.
 */
const getAggregationAwareDecimalPrecision = (
  displayMetric: TRAQIV2Metric,
  configDecimalPrecision: number,
  atomicMetricLike: AtomicMetricLike<TRAQIV2Metric>,
  chartSpec: Pick<RAQIV2ChartSpec, 'filter'> | null | undefined,
): number => {
  const apiConfig = lookupUIMetricApiConfig(displayMetric);
  if (!apiConfig || apiConfig.dimension !== RAQIV2UIPseudoDimension.AggregationType) {
    return configDecimalPrecision;
  }

  // Source identity for AggregationType-fanout metrics now lives on the
  // atomic metric itself (e.g. CustomEventsAtomicMetricLike). Prefer that
  // structured field over the legacy chart-spec filter so callers that
  // build the atomic correctly don't need to also re-pack AggregationType
  // into the chart spec just for formatter sake.
  const atomicAggregationType = isCustomEventsAtomicMetricLike(atomicMetricLike)
    ? atomicMetricLike.aggregationType
    : undefined;

  const filterAggregationType = (() => {
    const aggregationFilter = chartSpec?.filter?.find(
      (f) => f.dimension === RAQIV2UIPseudoDimension.AggregationType,
    );
    if (!aggregationFilter || aggregationFilter.values.length !== 1) {
      return undefined;
    }
    return aggregationFilter.values[0];
  })();

  const aggregationType = atomicAggregationType ?? filterAggregationType;
  if (!aggregationType) {
    return configDecimalPrecision;
  }
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
    if (isPureL7SmoothingComputedMetric(metric)) {
      // A 7-day rolling average preserves the source metric's units and
      // formatting properties. Delegate to the underlying source so the
      // smoothed series renders identically to the un-smoothed one
      // (Robux icon, percentage scaling, decimal precision, suffix, etc.).
      return generateAnalyticsNumberFormattingSpec({
        metric: metric.sources[0].metric,
        context,
        numberContextMetadata,
      });
    }
    const verbosity = getComputedMetricVerbosity(context);
    return {
      abbreviate: verbosity === NumberVerbosity.Abbreviate,
      numberFormatOptions: {
        minimumFractionDigits: 0,
        maximumFractionDigits: maxRequiredDecimalPrecision,
      },
    };
  }

  const displayMetric = getUIMetricFromAtomicMetricLike(metric);
  const metricDisplayConfig = getMetricDisplayConfig(displayMetric);
  const verbosity = getVerbosity(displayMetric, context);

  const {
    unit,
    specialNumberFormatting,
    decimalPrecision: configDecimalPrecision,
  } = metricDisplayConfig;

  const decimalPrecision = getAggregationAwareDecimalPrecision(
    displayMetric,
    configDecimalPrecision,
    metric,
    numberContextMetadata?.chartSpec,
  );

  const numberFormatOptions: Intl.NumberFormatOptions = {
    minimumFractionDigits: Math.min(decimalPrecision, maxRequiredDecimalPrecision),
    maximumFractionDigits: decimalPrecision,
    ...MetricUnitNumberFormatterSettingOverride[unit],
  };

  const prefix = getPrefix(displayMetric);
  let suffix = getSuffix(displayMetric, verbosity);

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
        // oxlint-disable-next-line @typescript-eslint/no-unnecessary-template-expression
        return `${currencyFilterValue[0]}`;
      }
      return '';
    };
    const currencyName = getCurrencyNameFromChartSpec(numberContextMetadata?.chartSpec);
    if (verbosity === NumberVerbosity.ShortSuffix || verbosity === NumberVerbosity.LongSuffix) {
      suffix = {
        type: TranslationKeyOrFormattedTextType.DynamicFormattedText,
        // oxlint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
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
    scalingFactor: getScalingFactor(displayMetric),
  };
};
