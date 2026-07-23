import {
  ChartSummaryItemSpec,
  ChartSummaryType,
  getComparisonChipSpec,
  getComparisonChipTooltip,
  getComparisonTimeRange,
  NumberContext,
  SeriesIntervalMeaning,
  SplineChartTimeSeriesNamedData,
  TimeSeriesSplineChartSpec,
  TNumberContextMetadata,
  Timestamp,
  Value,
  logAnalyticsError,
  SummaryValueType,
} from '@modules/charts-generic';
import { SeriesDataTypes } from '@rbx/analytics-ui';
import RAQIV2ChartSpec from '../types/RAQIV2ChartSpec';
import { RAQIV2TranslationDependencies } from '../types/RAQIV2DimensionRenderer';
import {
  isRAQIV2DoubleMetricSummaryType,
  RAQIV2CompoundDoubleMetricSummaryType,
  RAQIV2CompoundSummaryType,
} from '../enums/RAQIV2SummaryType';
import { generateAnalyticsNumberFormattingSpec } from '../utils/analyticsNumberFormattingSpec';
import { isComputedMetric } from '../types/ComputedMetric';
import { getIsPositiveGoodFromMetricLike } from '../utils/metricLikeSemantics';

type GenericRAQIV2TimeSeriesSplineQuotaChartAdapterProps = {
  charts: [TimeSeriesSplineChartSpec, TimeSeriesSplineChartSpec];
  spec: RAQIV2ChartSpec;
  translationDependencies: RAQIV2TranslationDependencies;
  seriesIntervalMeaning: SeriesIntervalMeaning;
  summarySpec: RAQIV2CompoundSummaryType[];
  numberContextMetadata?: TNumberContextMetadata;
};

export const getSummarizeValueForDoubleSeries = (
  summaryCompoundType: RAQIV2CompoundDoubleMetricSummaryType,
  primarySeries: SplineChartTimeSeriesNamedData,
  secondarySeries: SplineChartTimeSeriesNamedData,
): number => {
  const { type } = summaryCompoundType;
  switch (type) {
    case ChartSummaryType.QuotaPercentageUsage: {
      const secondaryValueMap = new Map(
        secondarySeries.dataPoints as Array<[Timestamp, Value | null]>,
      );

      const { count, sum } = primarySeries.dataPoints.reduce(
        (acc, [primaryTimestamp, primaryValue]) => {
          const secondaryValue = secondaryValueMap.get(primaryTimestamp);

          if (primaryValue !== null && secondaryValue) {
            return {
              count: acc.count + 1,
              sum: acc.sum + primaryValue / secondaryValue,
            };
          }
          return acc;
        },
        { count: 0, sum: 0 },
      );

      return count > 0 ? sum / count : 0;
    }
    default: {
      const exhaustiveCheck: never = type;
      throw new Error(`Unknown RAQIV2CompoundDoubleMetricSummaryType ${exhaustiveCheck}`);
    }
  }
};

type SummarizeDoubleMetricSeriesProps = {
  spec: RAQIV2ChartSpec;
  series: {
    primarySeries: SplineChartTimeSeriesNamedData;
    secondarySeries: SplineChartTimeSeriesNamedData;
    primaryComparisonSeries?: SplineChartTimeSeriesNamedData;
    secondaryComparisonSeries?: SplineChartTimeSeriesNamedData;
  };
  translationDependencies: RAQIV2TranslationDependencies;
  compoundSummaryType: RAQIV2CompoundDoubleMetricSummaryType;
  numberContextMetadata?: TNumberContextMetadata;
  comparisonStartDate: Date;
  comparisonEndDate: Date;
};

// see more in genericRAQIV2ChartSummaryAdapter.ts for single metric series summary
const summarizeDoubleMetricSeries = ({
  series,
  spec,
  translationDependencies: { translate },
  compoundSummaryType,
  numberContextMetadata,
  comparisonStartDate,
  comparisonEndDate,
}: SummarizeDoubleMetricSeriesProps): ChartSummaryItemSpec => {
  const { specificLabel } = compoundSummaryType;
  const isPositiveGood = getIsPositiveGoodFromMetricLike(spec.metric);

  const { primarySeries, secondarySeries, primaryComparisonSeries, secondaryComparisonSeries } =
    series;

  const value = getSummarizeValueForDoubleSeries(
    compoundSummaryType,
    primarySeries,
    secondarySeries,
  );

  const formattingSpec = generateAnalyticsNumberFormattingSpec({
    metric: spec.metric,
    context: NumberContext.ChartSummary,
    numberContextMetadata: {
      ...(numberContextMetadata ?? { chartSpec: null }),
      chartSummaryType: compoundSummaryType.type,
    },
  });

  // Comparison chips are suppressed for computed metrics until isPositiveGood can be derived
  // from the equation and source metrics. See TODO in getIsPositiveGoodFromMetricLike (DSA-5477).
  const comparisonChipSpec =
    primaryComparisonSeries && secondaryComparisonSeries && !isComputedMetric(spec.metric)
      ? getComparisonChipSpec({
          isPositiveGood,
          current: value,
          previous: getSummarizeValueForDoubleSeries(
            compoundSummaryType,
            primaryComparisonSeries,
            secondaryComparisonSeries,
          ),
          hasBackground: true,
          tooltip: getComparisonChipTooltip({
            translate,
            startDate: spec.timeSpec.startTime,
            endDate: spec.timeSpec.endTime,
            comparisonStartDate,
            comparisonEndDate,
          }),
          numberContextMetadata,
        })
      : undefined;

  return {
    summaryValueType: SummaryValueType.Numeric,
    value,
    formattingSpec,
    summaryType: compoundSummaryType.type,
    specificLabel: specificLabel
      ? translate(specificLabel.translationKey, specificLabel.arguments)
      : undefined,
    correspondingBreakdowns: [],
    comparisonChipSpec,
    numberContextMetadata,
  };
};

const getTotalAndComparisonSeries = (
  chart: TimeSeriesSplineChartSpec,
): {
  total: SplineChartTimeSeriesNamedData | undefined;
  comparison: SplineChartTimeSeriesNamedData | undefined;
} => {
  return {
    total: chart.series.find((s) => s.type === SeriesDataTypes.Total),
    comparison: chart.series.find((s) => s.type === SeriesDataTypes.Comparison),
  };
};

const genericRAQIV2TimeSeriesDoubleMetricSummaryAdapter = ({
  charts,
  spec,
  translationDependencies,
  summarySpec,
  seriesIntervalMeaning,
  numberContextMetadata,
}: GenericRAQIV2TimeSeriesSplineQuotaChartAdapterProps): ChartSummaryItemSpec[] => {
  const { comparisonStartDate, comparisonEndDate } = getComparisonTimeRange(
    spec.timeSpec.startTime,
    spec.timeSpec.endTime,
    seriesIntervalMeaning,
  );

  const [primaryChart, secondaryChart] = charts;
  const { total: primarySeries, comparison: primaryComparisonSeries } =
    getTotalAndComparisonSeries(primaryChart);
  const { total: secondarySeries, comparison: secondaryComparisonSeries } =
    getTotalAndComparisonSeries(secondaryChart);

  if (!primarySeries || !secondarySeries) {
    logAnalyticsError(
      `total series is required for double metric summary - genericRAQIV2TimeSeriesDoubleMetricSummaryAdapter - ${spec.metric}`,
    );
    return [];
  }

  return summarySpec.filter(isRAQIV2DoubleMetricSummaryType).map((summaryType) =>
    summarizeDoubleMetricSeries({
      series: {
        primarySeries,
        secondarySeries,
        primaryComparisonSeries,
        secondaryComparisonSeries,
      },
      spec,
      translationDependencies,
      compoundSummaryType: summaryType,
      numberContextMetadata,
      comparisonStartDate,
      comparisonEndDate,
    }),
  );
};

export default genericRAQIV2TimeSeriesDoubleMetricSummaryAdapter;
