import type { SingleLineSeries, LineRange } from '@rbx/analytics-ui';
import { SeriesDataTypes, ChartColor } from '@rbx/analytics-ui';
import { RAQIV2Metric, RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import type { Locale } from '@rbx/intl';
import type {
  FormattedText,
  TranslationKeyToFormattedText,
} from '@modules/analytics-translations/types';
import { translationKeyWithoutNamespace } from '@modules/analytics-translations/wrapperFunctions';
import type { SeriesDataPoints } from '@modules/charts-generic/adapters/genericRAQIChartAdapter';
import {
  buildSingleSeriesInfo,
  InfillBehavior,
} from '@modules/charts-generic/adapters/genericRAQIChartAdapter';
import type { SeriesMetadata } from '@modules/charts-generic/charts/types/SeriesMetadata';
import type { TimeSeriesSplineChartSpec } from '@modules/charts-generic/charts/types/TimeSeriesSplineChartTypes';
import type {
  TagFormatterFn,
  TimeSeriesData,
  TimeSeriesRangeTagData,
  Timestamp,
  Value,
} from '@modules/charts-generic/charts/types/TimeSeriesTypes';
import logAnalyticsError from '@modules/charts-generic/utils/logAnalyticsError';
import ordinalizePercentileByLocale from '@modules/charts-generic/utils/ordinalizePercentileByLocale';
import type {
  AnalyticsBenchmarkDataPointMetadata,
  AnalyticsBenchmarkMetricValue,
  AnalyticsBenchmarkQueryResult,
  ValidAnalyticsBenchmarkType,
} from '@modules/clients/analytics';
import { AnalyticsBenchmarkPercentile, AnalyticsBenchmarkType } from '@modules/clients/analytics';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import getAnalyticsMetricDisplayConfig from '../constants/AnalyticsMetricDisplayConfig';
import {
  BenchmarkGenre,
  benchmarkGenreToTranslationKeyOnCharts,
} from '../constants/BenchmarkGenre';
import { BenchmarkType, benchmarkTypeToTranslationKey } from '../constants/BenchmarkType';
import type RAQIV2ChartSpec from '../types/RAQIV2ChartSpec';
import type { RAQIV2TranslationDependencies } from '../types/RAQIV2DimensionRenderer';
import { getRAQIV2BenchmarkMetricFromMetricLike } from '../utils/metricLikeSemantics';

enum BenchmarkLineType {
  Spline = 'spline',
  Range = 'range',
}

const benchmarkTypeToLineType: Record<ValidAnalyticsBenchmarkType, BenchmarkLineType> = {
  [AnalyticsBenchmarkType.Genre]: BenchmarkLineType.Range,
  [AnalyticsBenchmarkType.Similarity]: BenchmarkLineType.Range,
  [AnalyticsBenchmarkType.TopExperiences]: BenchmarkLineType.Spline,
};

const apiBenchmarkTypeToChartBenchmarkType: Record<ValidAnalyticsBenchmarkType, BenchmarkType> = {
  [AnalyticsBenchmarkType.Genre]: BenchmarkType.Genre,
  [AnalyticsBenchmarkType.Similarity]: BenchmarkType.Similarity,
  [AnalyticsBenchmarkType.TopExperiences]: BenchmarkType.Platform,
};

const getSeriesBenchmarkType = (
  series: AnalyticsBenchmarkMetricValue,
): BenchmarkLineType | 'InvalidBenchmarkSeries' => {
  const firstBenchmarkType = series.dataPoints?.[0].metadata?.benchmarkType;
  if (!firstBenchmarkType || firstBenchmarkType === AnalyticsBenchmarkType.Invalid) {
    return 'InvalidBenchmarkSeries';
  }
  const lineType = benchmarkTypeToLineType[firstBenchmarkType];
  if (
    series.dataPoints?.every(
      (dataPoint) =>
        dataPoint.metadata?.benchmarkType &&
        dataPoint.metadata?.benchmarkType !== AnalyticsBenchmarkType.Invalid &&
        benchmarkTypeToLineType[dataPoint.metadata?.benchmarkType] === lineType,
    )
  ) {
    return lineType;
  }
  return 'InvalidBenchmarkSeries';
};

const ingestAllTimestamps = (data: AnalyticsBenchmarkQueryResult) => {
  const allTimestamps = new Set<Timestamp>();
  data?.values?.forEach((series) => {
    if (series?.dataPoints) {
      series.dataPoints.forEach((dataPoint) => {
        if (dataPoint.time) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
          allTimestamps.add(new Date(dataPoint.time).getTime() as Timestamp);
        }
      });
    }
  });
  return Array.from(allTimestamps).sort((a, b) => a - b);
};

// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
const parseTimestamp = (timestamp: string) => new Date(timestamp).getTime() as Timestamp;

const buildSeriesDataPoints = (series: AnalyticsBenchmarkMetricValue) => {
  const seriesDataPoints: SeriesDataPoints = new Map<Timestamp, Value | null>();
  series.dataPoints?.forEach((dataPoint) => {
    if (dataPoint.time) {
      seriesDataPoints.set(
        parseTimestamp(dataPoint.time),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
        dataPoint.value === null ? null : ((dataPoint.value ?? 0) as Value),
      );
    }
  });
  return seriesDataPoints;
};

const getPercentile = (
  series: AnalyticsBenchmarkMetricValue,
): AnalyticsBenchmarkPercentile | undefined => {
  const percentileBreakdown = series.breakdownValue?.find(
    (breakdown) => breakdown.dimension === 'Percentile',
  );
  const percentile = percentileBreakdown?.value;
  if (!percentile || !isValidEnumValue(AnalyticsBenchmarkPercentile, percentile)) {
    return undefined;
  }
  return percentile;
};

export type BenchmarkSeriesMetadata = {
  metric: RAQIV2Metric;
  percentile: AnalyticsBenchmarkPercentile;
};

type TBenchmarkDataModification =
  | {
      type: BenchmarkLineType.Spline;
      data: SingleLineSeries<number, number>;
      benchmarkSeriesMetadata?: Map<string, BenchmarkSeriesMetadata>;
    }
  | {
      type: BenchmarkLineType.Range;
      data: LineRange<number, number, TagFormatterFn>;
    };

const benchmarkPoolSize = 10000;

const getBenchmarkLegendText = ({
  metric,
  percentile,
  translationDeps,
  locale,
}: {
  metric: RAQIV2Metric;
  percentile?: AnalyticsBenchmarkPercentile;
  translationDeps: RAQIV2TranslationDependencies;
  locale: Locale;
}): FormattedText | null => {
  if (!percentile) {
    return null;
  }
  const { translate } = translationDeps;
  const formatNumber = Intl.NumberFormat(locale).format;

  if (metric === RAQIV2Metric.UniqueAbuseReportSubmittersPer1000PlaytimeHours) {
    return translate(translationKeyWithoutNamespace('Label.TypeLegendPercentileBenchmark'), {
      percentile: ordinalizePercentileByLocale(Number(percentile), locale),
    });
  }

  const key = translationKeyWithoutNamespace('Label.VariableBenchmarkLegend');
  switch (percentile) {
    case AnalyticsBenchmarkPercentile.P0:
      return translate(key, { num: formatNumber(benchmarkPoolSize) });
    case AnalyticsBenchmarkPercentile.P25:
      return translate(key, { num: formatNumber((benchmarkPoolSize * 3) / 4) });
    case AnalyticsBenchmarkPercentile.P50:
      return translate(key, { num: formatNumber(benchmarkPoolSize / 2) });
    case AnalyticsBenchmarkPercentile.P75:
      return translate(key, { num: formatNumber(benchmarkPoolSize / 4) });
    case AnalyticsBenchmarkPercentile.P90:
      return translate(key, { num: formatNumber(benchmarkPoolSize / 10) });
    case AnalyticsBenchmarkPercentile.P95:
      return translate(key, { num: formatNumber(benchmarkPoolSize / 20) });
    case AnalyticsBenchmarkPercentile.P98:
      return translate(key, { num: formatNumber(benchmarkPoolSize / 50) });
    default: {
      const exhaustiveCheck: never = percentile;
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
      throw new Error(`Unhandled percentile: ${exhaustiveCheck}`);
    }
  }
};

const buildSplineSeries = (
  metric: RAQIV2Metric,
  series: AnalyticsBenchmarkMetricValue,
  sortedTimestamps: Array<Timestamp>,
  locale: Locale,
  translationDeps: RAQIV2TranslationDependencies,
): TBenchmarkDataModification => {
  const seriesDataPoints = buildSeriesDataPoints(series);
  const percentile = getPercentile(series);
  const { translate } = translationDeps;
  const legendName =
    getBenchmarkLegendText({ metric, percentile, translationDeps, locale }) ??
    translate(translationKeyWithoutNamespace('Label.Unknown'));
  const benchmarkSeriesInfo = buildSingleSeriesInfo({
    seriesId: percentile,
    legendName,
    dataPoints: seriesDataPoints,
    sortedTimestamps,
    granularity: RAQIV2MetricGranularity.OneDay,
    locale,
    infillBehavior: InfillBehavior.ZeroIfNotNull,
  });
  const seriesMetadata = new Map<string, BenchmarkSeriesMetadata>();
  const benchmarkSeriesId = `benchmark-${metric}-p${percentile}`;
  if (percentile) {
    seriesMetadata.set(benchmarkSeriesId, {
      metric,
      percentile,
    });
  }

  return {
    type: BenchmarkLineType.Spline,
    data: {
      id: benchmarkSeriesId,
      name: benchmarkSeriesInfo.legendName,
      dataPoints: benchmarkSeriesInfo.data,
      type: SeriesDataTypes.Benchmark,
    },
    benchmarkSeriesMetadata: seriesMetadata,
  };
};

const getBenchmarkMetadata = (series: AnalyticsBenchmarkMetricValue) => {
  const map = new Map<Timestamp, AnalyticsBenchmarkDataPointMetadata>();
  series.dataPoints?.forEach((dataPoint) => {
    if (dataPoint.time && dataPoint.metadata) {
      map.set(parseTimestamp(dataPoint.time), dataPoint.metadata);
    }
  });
  return map;
};

export const makeTagFormatterFn = (
  benchmarkType: BenchmarkType,
  genre: string | undefined,
): TagFormatterFn => {
  return (translate: TranslationKeyToFormattedText) => {
    if (benchmarkType === BenchmarkType.Genre) {
      if (genre && isValidEnumValue(BenchmarkGenre, genre) && genre !== BenchmarkGenre.General) {
        return translate(benchmarkGenreToTranslationKeyOnCharts[genre]);
      }
      return translate(benchmarkGenreToTranslationKeyOnCharts[BenchmarkGenre.General]);
    }
    return translate(benchmarkTypeToTranslationKey[benchmarkType]);
  };
};

const buildRangeSeriesTag = (
  topSeries: AnalyticsBenchmarkMetricValue,
  bottomSeries: AnalyticsBenchmarkMetricValue,
  sortedTimestamps: Array<Timestamp>,
) => {
  const tags: TimeSeriesRangeTagData = [];

  const topMetadata = getBenchmarkMetadata(topSeries);
  const bottomMetadata = getBenchmarkMetadata(bottomSeries);
  sortedTimestamps.forEach((timestamp) => {
    const topTag = topMetadata.get(timestamp);
    const bottomTag = bottomMetadata.get(timestamp);

    if (
      !topTag ||
      !bottomTag ||
      !topTag.benchmarkType ||
      topTag.benchmarkType === AnalyticsBenchmarkType.Invalid ||
      !bottomTag.benchmarkType ||
      bottomTag.benchmarkType === AnalyticsBenchmarkType.Invalid
    ) {
      logAnalyticsError('Invalid benchmark tags');
      return;
    }

    if (topTag.benchmarkType !== bottomTag.benchmarkType || topTag.genre !== bottomTag.genre) {
      // Skip if the tags are not the same or if the benchmark type is invalid
      logAnalyticsError('Mismatched benchmark tags');
      return;
    }
    tags.push([
      timestamp,
      makeTagFormatterFn(apiBenchmarkTypeToChartBenchmarkType[topTag.benchmarkType], topTag.genre),
    ]);
  });
  return tags;
};

const filterValidTaggedDataPoints = (dataPoints: TimeSeriesData, tags: TimeSeriesRangeTagData) => {
  const metadata = new Map<Timestamp, TagFormatterFn | null>(
    tags.map(([timestamp, value]) => [timestamp, value]),
  );
  return dataPoints.filter((value) => metadata.has(value[0]));
};

const buildRangeSeries = (
  topSeries: AnalyticsBenchmarkMetricValue,
  bottomSeries: AnalyticsBenchmarkMetricValue,
  sortedTimestamps: Array<Timestamp>,
  locale: Locale,
): TBenchmarkDataModification => {
  const topSeriesDataPoints = buildSeriesDataPoints(topSeries);
  const bottomSeriesDataPoints = buildSeriesDataPoints(bottomSeries);
  const topPercentile = getPercentile(topSeries);
  const bottomPercentile = getPercentile(bottomSeries);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
  const unusedPlaceholderLegendName = 'Benchmark' as FormattedText;
  const { data: topFormattedData } = buildSingleSeriesInfo({
    seriesId: `${topPercentile}-${bottomPercentile}`,
    legendName: unusedPlaceholderLegendName,
    dataPoints: topSeriesDataPoints,
    sortedTimestamps,
    granularity: RAQIV2MetricGranularity.OneDay,
    locale,
    infillBehavior: InfillBehavior.ZeroIfNotNull,
  });
  const { data: bottomFormattedData } = buildSingleSeriesInfo({
    seriesId: `${topPercentile}-${bottomPercentile}`,
    legendName: unusedPlaceholderLegendName,
    dataPoints: bottomSeriesDataPoints,
    sortedTimestamps,
    granularity: RAQIV2MetricGranularity.OneDay,
    locale,
    infillBehavior: InfillBehavior.ZeroIfNotNull,
  });
  const tags = buildRangeSeriesTag(topSeries, bottomSeries, sortedTimestamps);
  const filteredTopData = filterValidTaggedDataPoints(topFormattedData, tags);
  const filteredBottomData = filterValidTaggedDataPoints(bottomFormattedData, tags);
  return {
    type: BenchmarkLineType.Range,
    data: {
      name: unusedPlaceholderLegendName,
      topDataPoints: filteredTopData,
      bottomDataPoints: filteredBottomData,
      tags,
    },
  };
};

const findRangeSeries = (
  series: Array<AnalyticsBenchmarkMetricValue>,
  percentiles?: [number, number],
) => {
  if (percentiles) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
    const topSeries = series.find((s) => getPercentile(s) === percentiles[1].toString());
    // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
    const bottomSeries = series.find((s) => getPercentile(s) === percentiles[0].toString());
    return [topSeries, bottomSeries];
  }
  // Default - Top is always P90, Bottom is always P50
  const topSeries = series.find((s) => getPercentile(s) === AnalyticsBenchmarkPercentile.P90);
  const bottomSeries = series.find((s) => getPercentile(s) === AnalyticsBenchmarkPercentile.P50);
  return [topSeries, bottomSeries];
};

const ingestBenchmarkValues = (
  metric: RAQIV2Metric,
  data: AnalyticsBenchmarkQueryResult,
  locale: Locale,
  translationDeps: RAQIV2TranslationDependencies,
  percentiles?: [number, number],
) => {
  const seriesWithValue = data?.values?.filter(
    (value) => value?.dataPoints?.length && value?.dataPoints?.length > 0,
  );
  if (!seriesWithValue || seriesWithValue.length === 0) {
    return null;
  }
  const sortedTimestamps = ingestAllTimestamps(data);

  // NOTE(shumingxu, 11/13/2024): We currently do not have concrete plans on supporting multiple benchmarks
  // in a single chart. So a chart has either a single spline series or two range series. Any other cases will fail.
  const firstSeriesLineType = getSeriesBenchmarkType(seriesWithValue[0]);
  if (firstSeriesLineType === BenchmarkLineType.Spline) {
    return buildSplineSeries(metric, seriesWithValue[0], sortedTimestamps, locale, translationDeps);
  }

  if (firstSeriesLineType === BenchmarkLineType.Range) {
    const [topSeries, bottomSeries] = findRangeSeries(seriesWithValue, percentiles);
    if (!topSeries || !bottomSeries) {
      // oof we can't show half a range right now
      logAnalyticsError('Cannot show half a range benchmark');
      return null;
    }
    return buildRangeSeries(topSeries, bottomSeries, sortedTimestamps, locale);
  }
  return null;
};

const updateHighchartsDataWithBenchmark = (
  spec: RAQIV2ChartSpec,
  chartWithoutBenchmarks: TimeSeriesSplineChartSpec,
  benchmarkData: AnalyticsBenchmarkQueryResult,
  locale: Locale,
  translationDeps: RAQIV2TranslationDependencies,
): {
  chart: TimeSeriesSplineChartSpec;
  rangeBenchmark: LineRange<number, number, TagFormatterFn> | null;
  benchmarkSeriesMetadata?: Map<string, SeriesMetadata>;
} => {
  const benchmarkMetric = getRAQIV2BenchmarkMetricFromMetricLike(spec.metric);
  if (!benchmarkMetric) {
    return { chart: chartWithoutBenchmarks, rangeBenchmark: null };
  }
  const { isPositiveGood } = getAnalyticsMetricDisplayConfig(benchmarkMetric);
  const benchmarkDataModification = ingestBenchmarkValues(
    benchmarkMetric,
    benchmarkData,
    locale,
    translationDeps,
    spec.benchmarkPercentiles,
  );

  if (!benchmarkDataModification) {
    return { chart: chartWithoutBenchmarks, rangeBenchmark: null };
  }

  if (benchmarkDataModification.type === BenchmarkLineType.Spline) {
    return {
      chart: {
        ...chartWithoutBenchmarks,
        series: [
          ...chartWithoutBenchmarks.series,
          {
            id: benchmarkDataModification.data.id,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
            name: benchmarkDataModification.data.name as FormattedText,
            dataPoints: benchmarkDataModification.data.dataPoints.map(([timestamp, value]) => [
              // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
              timestamp as Timestamp,
              // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
              value as Value | null,
            ]),
            type: benchmarkDataModification.data.type,
            zones: [],
            color: !isPositiveGood ? ChartColor.Yellow : undefined,
            custom: benchmarkDataModification.data.custom,
          },
        ],
      },
      rangeBenchmark: null,
      benchmarkSeriesMetadata: benchmarkDataModification.benchmarkSeriesMetadata,
    };
  }

  if (benchmarkDataModification.type === BenchmarkLineType.Range) {
    return {
      chart: chartWithoutBenchmarks,
      rangeBenchmark: benchmarkDataModification.data,
    };
  }

  return { chart: chartWithoutBenchmarks, rangeBenchmark: null };
};

export default updateHighchartsDataWithBenchmark;
