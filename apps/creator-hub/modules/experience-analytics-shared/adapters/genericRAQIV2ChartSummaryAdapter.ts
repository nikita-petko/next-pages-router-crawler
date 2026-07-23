import { RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import type { FormattedText } from '@modules/analytics-translations/types';
import {
  translationKey,
  translationKeyWithoutNamespace,
} from '@modules/analytics-translations/wrapperFunctions';
import type {
  ChartSummaryItemSpec,
  NumericChartSummaryItemSpec,
  StringChartSummaryItemSpec,
} from '@modules/charts-generic/charts/ChartSummaryItem';
import { SummaryValueType } from '@modules/charts-generic/charts/ChartSummaryItem';
import type { TNumberContextMetadata } from '@modules/charts-generic/charts/numberFormatters';
import { NumberContext } from '@modules/charts-generic/charts/numberFormatters';
import {
  ChartUnit,
  ChartUnitAggregationType,
} from '@modules/charts-generic/charts/types/ChartTypes';
import type { GenericSeriesInfo } from '@modules/charts-generic/charts/types/SeriesTypes';
import ChartSummaryType from '@modules/charts-generic/enums/ChartSummaryType';
import {
  getComparisonChipSpec,
  getComparisonChipTooltip,
} from '@modules/charts-generic/utils/comparisonChipUtils';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import getDimensionRenderer from '../components/getDimensionRenderer';
import getAnalyticsMetricDisplayConfig from '../constants/AnalyticsMetricDisplayConfig';
import chartUnitToAverageSummaryAggregationType from '../constants/ChartUnitToAverageSummaryAggregationType';
import type {
  RAQIV2CompoundSingleMetricSummaryType,
  RAQIV2CompoundSummaryType,
  RAQIV2CompoundAggregatedBreakdownSummaryType,
} from '../enums/RAQIV2SummaryType';
import { isRAQIV2SingleMetricSummaryType } from '../enums/RAQIV2SummaryType';
import { getUIMetricFromAtomicMetricLike, isComputedMetric } from '../types/ComputedMetric';
import type RAQIV2ChartSpec from '../types/RAQIV2ChartSpec';
import type { RAQIV2TranslationDependencies } from '../types/RAQIV2DimensionRenderer';
import { generateAnalyticsNumberFormattingSpec } from '../utils/analyticsNumberFormattingSpec';
import { getIsPositiveGoodFromMetricLike } from '../utils/metricLikeSemantics';

export type RAQIV2SummarySpec = {
  /** If there is a total, add summary item(s) of this type */
  totalSummaryTypes: Array<RAQIV2CompoundSummaryType>;

  /** If there are breakdowns, add summary items of this type for each */
  perBreakdownSummaryTypes: RAQIV2CompoundSingleMetricSummaryType[];

  /** Summary types that aggregate across all breakdown series to produce one result */
  aggregatedBreakdownSummaryTypes: RAQIV2CompoundAggregatedBreakdownSummaryType[];

  /** If provided, only add summary item for breakdown whose breakdown value matches this */
  breakdownSummaryFilter?: Partial<Record<RAQIV2Dimension, string[]>>;
};

// Adapted from summarizeSeriesDataPoints
export const getSummarizeValueForSingleSeries = <T, V extends number>(
  series: Pick<GenericSeriesInfo<T, V>, 'dataPoints'>,
  compoundType: RAQIV2CompoundSingleMetricSummaryType,
) => {
  const { type } = compoundType;
  const total = series.dataPoints.reduce((sum, cur) => {
    return type === ChartSummaryType.TotalAbsoluteValue
      ? sum + Math.abs(cur[1] ?? 0)
      : sum + (cur[1] ?? 0);
  }, 0);

  switch (type) {
    case ChartSummaryType.Total:
    case ChartSummaryType.TotalAbsoluteValue:
      return total;
    case ChartSummaryType.Average: {
      const countNonNull = series.dataPoints.reduce(
        (count, cur) => count + (cur[1] === null ? 0 : 1),
        0,
      );
      return countNonNull ? total / countNonNull : 0;
    }
    case ChartSummaryType.SinglePoint:
      return series.dataPoints.find(([x]) => x === compoundType.selectedXValue)?.[1] ?? 0;
    case ChartSummaryType.GrowthRate: {
      if (series.dataPoints.length === 0) {
        return Number.NaN;
      }
      const firstValue = series.dataPoints[0][1] ?? 0;
      const lastValue = series.dataPoints[series.dataPoints.length - 1][1] ?? 0;
      return firstValue === 0 ? 0 : (lastValue - firstValue) / firstValue;
    }
    case ChartSummaryType.LastValue: {
      if (series.dataPoints.length === 0) {
        return 0;
      }
      const lastPoint = series.dataPoints[series.dataPoints.length - 1];
      return lastPoint[1] ?? 0;
    }
    default: {
      const exhaustiveCheck: never = type;
      throw new Error(`Unsupported summary type ${exhaustiveCheck as string}`);
    }
  }
};

export const getSummaryAggregationType = (
  unit: ChartUnit,
  type: ChartSummaryType,
): ChartUnitAggregationType => {
  switch (type) {
    case ChartSummaryType.Total:
    case ChartSummaryType.TotalAbsoluteValue:
      return ChartUnitAggregationType.SummaryTotal;
    case ChartSummaryType.QuotaPercentageUsage:
      return ChartUnitAggregationType.AverageQuotaUsage;
    case ChartSummaryType.Average:
      return chartUnitToAverageSummaryAggregationType[unit];
    case ChartSummaryType.SinglePoint:
      return ChartUnitAggregationType.Unknown;
    case ChartSummaryType.GrowthRate:
      return ChartUnitAggregationType.Ratio;
    case ChartSummaryType.TopBreakdown:
      // TopBreakdown is handled by aggregated breakdown functions, not single series functions
      throw new Error('TopBreakdown should only be used in aggregated breakdown summary types');
    case ChartSummaryType.LastValue:
      return ChartUnitAggregationType.LastValue;
    default: {
      const exhaustiveCheck: never = type;
      throw new Error(`Unsupported summary type ${exhaustiveCheck as string}`);
    }
  }
};

export const getSummaryChartUnitOverride = (unit: ChartUnit, type: ChartSummaryType): ChartUnit => {
  switch (type) {
    case ChartSummaryType.Total:
    case ChartSummaryType.TotalAbsoluteValue:
    case ChartSummaryType.Average:
    case ChartSummaryType.SinglePoint:
    case ChartSummaryType.LastValue:
      return unit;
    case ChartSummaryType.QuotaPercentageUsage:
    case ChartSummaryType.GrowthRate:
      return ChartUnit.Percentage;
    case ChartSummaryType.TopBreakdown:
      // TopBreakdown is handled by aggregated breakdown functions, not single series functions
      throw new Error('TopBreakdown should only be used in aggregated breakdown summary types');
    default: {
      const exhaustiveCheck: never = type;
      throw new Error(`Unsupported summary type ${exhaustiveCheck as string}`);
    }
  }
};

type ComparisonSingleSeries<T, V> = {
  series: GenericSeriesInfo<T, V>;
  startTime: Date;
  endTime: Date;
};

const summarizeSingleSeries = <T, V extends number>(
  singleSeries: GenericSeriesInfo<T, V>,
  compoundType: RAQIV2CompoundSingleMetricSummaryType,
  spec: RAQIV2ChartSpec,
  { translate }: RAQIV2TranslationDependencies,
  comparisonSingleSeries: ComparisonSingleSeries<T, V> | null,
  numberContextMetadata?: TNumberContextMetadata,
): NumericChartSummaryItemSpec => {
  const { type, specificLabel } = compoundType;
  const breakdownName = singleSeries.isTotalSeries ? undefined : singleSeries.name;
  const isPositiveGood = getIsPositiveGoodFromMetricLike(spec.metric);
  const value = getSummarizeValueForSingleSeries(singleSeries, compoundType);
  const formattingSpec = generateAnalyticsNumberFormattingSpec({
    metric: spec.metric,
    context: NumberContext.ChartSummary,
    numberContextMetadata: {
      ...(numberContextMetadata ?? { chartSpec: null }),
      chartSummaryType: type,
    },
  });
  // Comparison chips are suppressed for computed metrics until isPositiveGood can be derived
  // from the equation and source metrics. See TODO in getIsPositiveGoodFromMetricLike (DSA-5477).
  const comparisonChipSpec =
    comparisonSingleSeries && !isComputedMetric(spec.metric)
      ? getComparisonChipSpec({
          isPositiveGood,
          current: value,
          previous: getSummarizeValueForSingleSeries(comparisonSingleSeries.series, compoundType),
          hasBackground: true,
          tooltip: getComparisonChipTooltip({
            translate,
            startDate: spec.timeSpec.startTime,
            endDate: spec.timeSpec.endTime,
            comparisonStartDate: comparisonSingleSeries.startTime,
            comparisonEndDate: comparisonSingleSeries.endTime,
          }),
          numberContextMetadata,
        })
      : undefined;

  return {
    summaryValueType: SummaryValueType.Numeric,
    value,
    formattingSpec,
    summaryType: type,
    specificLabel: specificLabel
      ? translate(specificLabel.translationKey, specificLabel.arguments)
      : breakdownName,
    correspondingBreakdowns: singleSeries.breakdownValues,
    comparisonChipSpec,
    numberContextMetadata,
  };
};

export const findMatchingBreakdownSeries = <T, V>(
  singleSeries: GenericSeriesInfo<T, V>,
  seriesToMatch: GenericSeriesInfo<T, V>[],
): GenericSeriesInfo<T, V> | undefined => {
  return seriesToMatch.find(
    (comparisonBreakdown) =>
      comparisonBreakdown.breakdownValues.length === singleSeries.breakdownValues.length &&
      comparisonBreakdown.breakdownValues.every((comparisonBreakdownValue) =>
        singleSeries.breakdownValues.find(
          (breakdownValue) =>
            breakdownValue.dimension === comparisonBreakdownValue.dimension &&
            breakdownValue.value === comparisonBreakdownValue.value,
        ),
      ),
  );
};

type ComparisonSeries<T, V> = {
  series: GenericSeriesInfo<T, V>[];
  startTime: Date;
  endTime: Date;
};

const getComparisonSingleSeries = <T, V>(
  comparisonSeries: ComparisonSeries<T, V> | null,
  breakdownSeries: GenericSeriesInfo<T, V> | null,
): ComparisonSingleSeries<T, V> | null => {
  if (!comparisonSeries) {
    return null;
  }
  // if breakdown is given, look for it, otherwise look for the total
  const foundComparisonSeries = breakdownSeries
    ? findMatchingBreakdownSeries(breakdownSeries, comparisonSeries.series)
    : comparisonSeries.series.find(({ isTotalSeries }) => isTotalSeries);
  if (!foundComparisonSeries) {
    return null;
  }
  return {
    series: foundComparisonSeries,
    startTime: comparisonSeries.startTime,
    endTime: comparisonSeries.endTime,
  };
};

const summarizeAggregatedBreakdownSeries = <T, V extends number>(
  breakdownSeries: GenericSeriesInfo<T, V>[],
  aggregatedType: RAQIV2CompoundAggregatedBreakdownSummaryType,
  spec: RAQIV2ChartSpec,
  translationDependencies: RAQIV2TranslationDependencies,
  numberContextMetadata?: TNumberContextMetadata,
): StringChartSummaryItemSpec | null => {
  if (breakdownSeries.length === 0) {
    return null;
  }

  const { translate, locale } = translationDependencies;
  const { type } = aggregatedType;

  let allBreakdownSummaries: NumericChartSummaryItemSpec[];

  switch (type) {
    case ChartSummaryType.TopBreakdown: {
      allBreakdownSummaries = breakdownSeries.map((breakdown) => {
        return summarizeSingleSeries(
          breakdown,
          { type: ChartSummaryType.Total },
          spec,
          translationDependencies,
          null,
          numberContextMetadata,
        );
      });

      const topSummary = allBreakdownSummaries.reduce((prev, current) =>
        prev && prev.value > current.value ? prev : current,
      );

      const breakdown = topSummary.correspondingBreakdowns[0]; // Using first breakdown for TopBreakdown display

      if (breakdown?.dimension && isValidEnumValue(RAQIV2Dimension, breakdown.dimension)) {
        const view = getDimensionRenderer(breakdown.dimension as RAQIV2Dimension);

        if (view && breakdown.value !== undefined) {
          const dimensionName = translationDependencies.translate(view.name);
          const description = translationDependencies.translate(
            translationKey('Description.TopBreakdown', TranslationNamespace.Analytics),
            { dimension: dimensionName.toLocaleLowerCase(locale) },
          );

          const summaryValue = view.getBreakdownValueName(
            { value: breakdown.value, displayValue: breakdown.displayValue },
            translationDependencies,
          );

          return {
            summaryValueType: SummaryValueType.String,
            value: summaryValue,
            specificLabel: description,
            summaryType: type,
            correspondingBreakdowns: topSummary.correspondingBreakdowns,
            tooltipKey: topSummary.tooltipKey,
          };
        }
      }

      const description =
        topSummary?.specificLabel ??
        // oxlint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        (breakdown?.value ? (breakdown.value as FormattedText) : undefined) ??
        translate(translationKeyWithoutNamespace('Label.Unknown'));

      return {
        value: translate(
          translationKey('Description.GenericTopBreakdown', TranslationNamespace.Analytics),
        ),
        specificLabel: description,
        summaryType: type,
        summaryValueType: SummaryValueType.String,
        correspondingBreakdowns: topSummary.correspondingBreakdowns,
        tooltipKey: topSummary.tooltipKey,
      };
    }
    default: {
      const exhaustiveCheck: never = type;
      throw new Error(`Unsupported aggregated breakdown summary type ${exhaustiveCheck as string}`);
    }
  }
};

export const summarizeSeriesInfo = <T, V extends number>(
  series: GenericSeriesInfo<T, V>[],
  spec: RAQIV2ChartSpec,
  summarySpec: RAQIV2SummarySpec,
  translationDependencies: RAQIV2TranslationDependencies,
  comparisonSeries: ComparisonSeries<T, V> | null,
  numberContextMetadata?: TNumberContextMetadata,
): Array<ChartSummaryItemSpec> => {
  const summaries: ChartSummaryItemSpec[] = [];
  const {
    totalSummaryTypes,
    perBreakdownSummaryTypes,
    aggregatedBreakdownSummaryTypes,
    breakdownSummaryFilter,
  } = summarySpec;

  if (totalSummaryTypes) {
    const totalSeries = series.find(({ isTotalSeries }) => isTotalSeries);
    if (totalSeries) {
      totalSummaryTypes.filter(isRAQIV2SingleMetricSummaryType).forEach((totalSummary, idx) => {
        let comparisonSingleSeries: ComparisonSingleSeries<T, V> | null = null;
        if (comparisonSeries && idx === 0) {
          // only show comparison for the first summary item for the total
          comparisonSingleSeries = getComparisonSingleSeries(comparisonSeries, null);
        }

        const summary = summarizeSingleSeries(
          totalSeries,
          totalSummary,
          spec,
          translationDependencies,
          comparisonSingleSeries,
          numberContextMetadata,
        );
        summaries.push(summary);
      });
    }
  }

  if (perBreakdownSummaryTypes) {
    const breakdownSeries = series.filter(({ isTotalSeries }) => !isTotalSeries);
    breakdownSeries.forEach((breakdown) => {
      let includeSummaryForThisBreakdownSeries = true;
      if (breakdownSummaryFilter) {
        const { breakdownValues } = breakdown;
        includeSummaryForThisBreakdownSeries = breakdownValues.some(({ value, dimension }) => {
          if (!dimension) {
            return true;
          }
          // oxlint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
          const allowedBreakdownValues = breakdownSummaryFilter[dimension as RAQIV2Dimension];
          if (!allowedBreakdownValues) {
            return true;
          }

          if (value === undefined) {
            return false;
          }

          return allowedBreakdownValues.includes(value);
        });
      }
      if (!includeSummaryForThisBreakdownSeries) {
        return;
      }

      perBreakdownSummaryTypes.forEach((breakdownSummaryType, idx) => {
        let comparisonSingleSeries: ComparisonSingleSeries<T, V> | null = null;
        if (comparisonSeries && idx === 0) {
          // only show comparison for the first summary item for each breakdown
          comparisonSingleSeries = getComparisonSingleSeries(comparisonSeries, breakdown);
        }
        summaries.push(
          summarizeSingleSeries(
            breakdown,
            breakdownSummaryType,
            spec,
            translationDependencies,
            comparisonSingleSeries,
          ),
        );
      });
    });
  }

  if (aggregatedBreakdownSummaryTypes.length > 0) {
    // Assuming single breakdown type for now
    const breakdownSeries = series.filter(
      ({ isTotalSeries, isComparisonSeries }) => !isTotalSeries && !isComparisonSeries,
    );
    if (breakdownSeries.length > 0) {
      aggregatedBreakdownSummaryTypes.forEach((aggregatedType) => {
        const aggregatedSummary = summarizeAggregatedBreakdownSeries(
          breakdownSeries,
          aggregatedType,
          spec,
          translationDependencies,
          numberContextMetadata,
        );
        if (aggregatedSummary) {
          summaries.push(aggregatedSummary);
        }
      });
    }
  }

  return summaries;
};

export const getDefaultSummarySpec = (spec: RAQIV2ChartSpec): RAQIV2SummarySpec => {
  const defaultTotalSummaryTypes: RAQIV2CompoundSummaryType[] = isComputedMetric(spec.metric)
    ? [{ type: ChartSummaryType.Average }]
    : (getAnalyticsMetricDisplayConfig(getUIMetricFromAtomicMetricLike(spec.metric))
        .defaultTotalSummaryTypes ?? []);
  return {
    totalSummaryTypes: defaultTotalSummaryTypes,
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  };
};

export const noSummarySpec: RAQIV2SummarySpec = {
  totalSummaryTypes: [],
  perBreakdownSummaryTypes: [],
  aggregatedBreakdownSummaryTypes: [],
};

const hasNonGrowthRateSummaryType = (summaryTypes: RAQIV2CompoundSummaryType[]): boolean => {
  return (
    summaryTypes.length === 0 ||
    summaryTypes.some((summaryType) => summaryType.type !== ChartSummaryType.GrowthRate)
  );
};

export const shouldShowComparison = (summarySpec: RAQIV2SummarySpec | undefined): boolean => {
  if (!summarySpec) {
    return true;
  }
  return hasNonGrowthRateSummaryType([
    ...summarySpec.totalSummaryTypes,
    ...summarySpec.perBreakdownSummaryTypes,
  ]);
};

/**
 * Whether any summary item will render a period-over-period comparison chip.
 *
 * Comparison chips attach to the first single-metric summary of the total series
 * and to per-breakdown summaries (see `summarizeSeriesInfo`). Aggregated-breakdown
 * summaries (e.g. TopBreakdown) never render a chip. This is the strict counterpart
 * to `shouldShowComparison` (which returns `true` for empty/aggregated-only specs):
 * it is used to decide whether a *breakdown* chart still needs to fetch comparison
 * data when the in-chart comparison overlay is off. The growth-rate-only case is
 * handled upstream by `shouldShowComparison`, which suppresses the chip entirely.
 */
export const summaryRendersComparisonChip = (
  summarySpec: RAQIV2SummarySpec | undefined,
): boolean => {
  if (!summarySpec) {
    return false;
  }
  return (
    summarySpec.totalSummaryTypes.some(isRAQIV2SingleMetricSummaryType) ||
    summarySpec.perBreakdownSummaryTypes.length > 0
  );
};
