import { useCallback, useMemo } from 'react';
import {
  RAQIV2AbuseChannel,
  RAQIV2AcquisitionSource,
  RAQIV2Dimension,
  RAQIV2Metric,
  RAQIV2MetricGranularity,
} from '@rbx/creator-hub-analytics-config';
import ChartResourceType from '@modules/charts-generic/enums/ChartResourceType';
import type { AnalyticsBenchmarkQuery } from '@modules/clients/analytics';
import { AnalyticsBenchmarkType } from '@modules/clients/analytics';
import type {
  QueryBenchmarkResult,
  BreakdownFilter,
} from '@modules/clients/analytics/analyticsBenchmark';
import {
  convertToTL7RAQIV2Metric,
  AnalyticsBenchmarkMetric,
} from '@modules/clients/analytics/analyticsBenchmark';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import {
  isNumericUIMetric,
  type TRAQIV2NumericUIMetric,
} from '../constants/AnalyticsMetricDisplayConfig';
import { BenchmarkType } from '../constants/BenchmarkType';
import { useCachedAnalyticsBenchmark } from '../context/AnalyticsBenchmarkProvider';
import type RAQIV2ChartSpec from '../types/RAQIV2ChartSpec';
import { getRAQIV2BenchmarkMetricFromMetricLike } from '../utils/metricLikeSemantics';
import { snapToLatestEndTime, snapToLatestStartTime } from '../utils/snapToLatestTimestep';
import useApiRequest from './useApiRequest';

type BenchmarkMetric = AnalyticsBenchmarkQuery['metric'];
export type BenchmarkOverlayType = BenchmarkType.Genre | BenchmarkType.Similarity;

const OrderedBenchmarkOverlayTypes: readonly BenchmarkOverlayType[] = [
  BenchmarkType.Genre,
  BenchmarkType.Similarity,
];

export const mapApiBenchmarkTypeToOverlayType = (
  benchmarkType: AnalyticsBenchmarkType | undefined,
): BenchmarkOverlayType | null => {
  if (benchmarkType === AnalyticsBenchmarkType.Genre) {
    return BenchmarkType.Genre;
  }
  if (benchmarkType === AnalyticsBenchmarkType.Similarity) {
    return BenchmarkType.Similarity;
  }
  return null;
};

export const mapOverlayTypeToApiBenchmarkType = (
  overlayType: BenchmarkOverlayType | undefined,
): AnalyticsBenchmarkType | undefined => {
  if (overlayType === BenchmarkType.Genre) {
    return AnalyticsBenchmarkType.Genre;
  }
  if (overlayType === BenchmarkType.Similarity) {
    return AnalyticsBenchmarkType.Similarity;
  }
  return undefined;
};

export const getAvailableBenchmarkTypesFromResult = (
  benchmarkResult: QueryBenchmarkResult | null,
): readonly BenchmarkOverlayType[] => {
  if (!benchmarkResult?.values?.length) {
    return [];
  }
  const availableBenchmarkTypes = new Set<BenchmarkOverlayType>();
  benchmarkResult.values.forEach((series) => {
    series?.dataPoints?.forEach((dataPoint) => {
      const benchmarkType = mapApiBenchmarkTypeToOverlayType(dataPoint?.metadata?.benchmarkType);
      if (benchmarkType) {
        availableBenchmarkTypes.add(benchmarkType);
      }
    });
  });
  return OrderedBenchmarkOverlayTypes.filter((benchmarkType) =>
    availableBenchmarkTypes.has(benchmarkType),
  );
};

export const filterBenchmarkResultByType = (
  benchmarkResult: QueryBenchmarkResult | null,
  benchmarkType: BenchmarkOverlayType | undefined,
): QueryBenchmarkResult | null => {
  if (!benchmarkResult || !benchmarkType) {
    return benchmarkResult;
  }
  const filteredValues =
    benchmarkResult.values?.flatMap((series) => {
      if (!series) {
        return [];
      }
      const filteredDataPoints =
        series.dataPoints?.filter(
          (dataPoint) =>
            mapApiBenchmarkTypeToOverlayType(dataPoint?.metadata?.benchmarkType) === benchmarkType,
        ) ?? [];
      if (filteredDataPoints.length === 0) {
        return [];
      }
      return [{ ...series, dataPoints: filteredDataPoints }];
    }) ?? [];
  return {
    ...benchmarkResult,
    values: filteredValues,
  };
};

const hasBenchmarkType = (
  benchmarkResult: QueryBenchmarkResult | null,
  benchmarkType: BenchmarkOverlayType,
): boolean =>
  benchmarkResult?.values?.some((series) =>
    series?.dataPoints?.some(
      (dataPoint) =>
        mapApiBenchmarkTypeToOverlayType(dataPoint?.metadata?.benchmarkType) === benchmarkType,
    ),
  ) ?? false;

const isAnyValidApiBenchmarkType = (benchmarkType: AnalyticsBenchmarkType | undefined): boolean =>
  Boolean(benchmarkType && benchmarkType !== AnalyticsBenchmarkType.Invalid);

export const hasAnyBenchmarks = (benchmarkResult: QueryBenchmarkResult | null): boolean =>
  benchmarkResult?.values?.some((series) =>
    series?.dataPoints?.some((dataPoint) =>
      isAnyValidApiBenchmarkType(dataPoint?.metadata?.benchmarkType),
    ),
  ) ?? false;
type BenchmarkMetricMappingConfig = Partial<
  Record<
    TRAQIV2NumericUIMetric,
    {
      defaultMetric?: BenchmarkMetric;
      filterMapping?: {
        dimension: RAQIV2Dimension;
        benchmarkMetricByFilterValue: Partial<Record<string, BenchmarkMetric>>;
      };
    }
  >
>;

// Should we move this to config??
const BenchmarkMetricMapping: BenchmarkMetricMappingConfig = {
  [RAQIV2Metric.UniqueAbuseReportSubmittersPer1000PlaytimeHours]: {
    defaultMetric: convertToTL7RAQIV2Metric(
      RAQIV2Metric.UniqueAbuseReportSubmittersPer1000PlaytimeHours,
    ),
  },

  [RAQIV2Metric.SourceCountRatioKpi]: {
    filterMapping: {
      dimension: RAQIV2Dimension.CreatorRewardsDailySource,
      benchmarkMetricByFilterValue: {
        DailyEngagements: AnalyticsBenchmarkMetric.DailyRewardedActiveSpendersPercentage,
        Signups: AnalyticsBenchmarkMetric.RewardedSignupsPercentage,
        Reactivations: AnalyticsBenchmarkMetric.RewardedReactivationsPercentage,
      },
    },
  },
};

export const getBenchmarkMetricByFilter = (
  spec: RAQIV2ChartSpec,
  benchmarkMetricMappingConfig: BenchmarkMetricMappingConfig = BenchmarkMetricMapping,
): BenchmarkMetric | null => {
  const benchmarkMetric = getRAQIV2BenchmarkMetricFromMetricLike(spec.metric);
  if (!benchmarkMetric || !isNumericUIMetric(benchmarkMetric)) {
    return null;
  }
  const filterMapping = benchmarkMetricMappingConfig[benchmarkMetric]?.filterMapping;
  if (!filterMapping || spec.filter?.length !== 1) {
    return null;
  }

  const [filter] = spec.filter;
  if (filter.dimension !== filterMapping.dimension || filter.values.length !== 1) {
    return null;
  }

  return filterMapping.benchmarkMetricByFilterValue[filter.values[0]] ?? null;
};

export const getBenchmarkMetric = (
  spec: RAQIV2ChartSpec,
  benchmarkMetricMappingConfig: BenchmarkMetricMappingConfig = BenchmarkMetricMapping,
): BenchmarkMetric | null => {
  const benchmarkMetric = getRAQIV2BenchmarkMetricFromMetricLike(spec.metric);
  if (!benchmarkMetric || !isNumericUIMetric(benchmarkMetric)) {
    return null;
  }
  return (
    getBenchmarkMetricByFilter(spec, benchmarkMetricMappingConfig) ||
    benchmarkMetricMappingConfig[benchmarkMetric]?.defaultMetric ||
    null
  );
};

// Exported for testing
export const allowBenchmarks = (spec: RAQIV2ChartSpec) => {
  const benchmarkMetric = getRAQIV2BenchmarkMetricFromMetricLike(spec.metric);
  if (!benchmarkMetric) {
    return false;
  }
  if (spec.breakdown?.length || spec.granularity !== RAQIV2MetricGranularity.OneDay) {
    return false;
  }

  if (spec.resource.type !== ChartResourceType.Universe) {
    return false;
  }

  if (
    benchmarkMetric === RAQIV2Metric.EndToEndCVR ||
    benchmarkMetric === RAQIV2Metric.EndToEndCVRMigration ||
    benchmarkMetric === RAQIV2Metric.QualifiedEndToEndCVR ||
    benchmarkMetric === RAQIV2Metric.QualifiedEndToEndCVRMigration
  ) {
    return (
      spec.filter?.length === 1 &&
      spec.filter[0].values.length === 1 &&
      spec.filter[0].values[0] === RAQIV2AcquisitionSource.HomeRecommendation
    );
  }

  if (benchmarkMetric === RAQIV2Metric.UniqueAbuseReportSubmittersPer1000PlaytimeHours) {
    return (
      !spec.filter?.length ||
      (spec.filter?.length === 1 &&
        spec.filter[0].dimension === RAQIV2Dimension.AbuseChannel &&
        spec.filter[0].values.length === 1 &&
        isValidEnumValue(RAQIV2AbuseChannel, spec.filter[0].values[0]))
    );
  }

  if (getBenchmarkMetricByFilter(spec)) {
    return true;
  }

  return !spec.filter?.length;
};

const getBenchmarkFilter = (spec: RAQIV2ChartSpec): BreakdownFilter[] | undefined => {
  const benchmarkMetric = getRAQIV2BenchmarkMetricFromMetricLike(spec.metric);
  if (!benchmarkMetric) {
    return undefined;
  }
  const filter: BreakdownFilter[] = [];
  if (
    benchmarkMetric === RAQIV2Metric.UniqueAbuseReportSubmittersPer1000PlaytimeHours &&
    spec.filter?.length === 1 &&
    spec.filter[0].dimension === RAQIV2Dimension.AbuseChannel &&
    spec.filter[0].values.length === 1 &&
    isValidEnumValue(RAQIV2AbuseChannel, spec.filter[0].values[0])
  ) {
    filter.push({
      dimension: RAQIV2Dimension.AbuseChannel,
      value: spec.filter[0].values[0],
    });
  }

  return filter;
};

export const getBenchmarkQuery = (spec: RAQIV2ChartSpec): AnalyticsBenchmarkQuery | null => {
  const benchmarkMetric = getRAQIV2BenchmarkMetricFromMetricLike(spec.metric);
  if (!benchmarkMetric) {
    return null;
  }
  if (!allowBenchmarks(spec)) {
    // We don't support benchmarks for filtered or breakdown charts
    return null;
  }

  return {
    startTime: snapToLatestStartTime(spec.timeSpec.startTime, spec.granularity),
    endTime: snapToLatestEndTime(spec.timeSpec.endTime, spec.granularity),
    metric: getBenchmarkMetric(spec) || benchmarkMetric,
    resourceType: spec.resource.type,
    resourceId: spec.resource.id.toString(),
    filter: getBenchmarkFilter(spec),
    percentiles: spec.benchmarkPercentiles,
  };
};

export const useAnalyticsBenchmarks = (
  spec: RAQIV2ChartSpec | null,
  benchmarkType?: BenchmarkType,
): {
  data: QueryBenchmarkResult | null;
  hasBenchmarks: boolean;
  hasSimilarityBenchmarks: boolean;
} => {
  const benchmarkOverlayType: BenchmarkOverlayType | undefined = useMemo(() => {
    if (benchmarkType === BenchmarkType.Genre || benchmarkType === BenchmarkType.Similarity) {
      return benchmarkType;
    }
    return;
  }, [benchmarkType]);

  const apiBenchmarkType = mapOverlayTypeToApiBenchmarkType(benchmarkOverlayType);

  const analyticsBenchmarkRequest: AnalyticsBenchmarkQuery | null = useMemo(() => {
    if (!spec) {
      return null;
    }
    const benchmarkMetric = getRAQIV2BenchmarkMetricFromMetricLike(spec.metric);
    if (!benchmarkMetric) {
      return null;
    }

    const query = getBenchmarkQuery(spec);
    if (query && apiBenchmarkType) {
      return { ...query, benchmarkType: apiBenchmarkType };
    }
    return query;
  }, [spec, apiBenchmarkType]);

  const { client } = useCachedAnalyticsBenchmark();

  const makeBenchmarkRequest = useCallback(async () => {
    if (!analyticsBenchmarkRequest) {
      return null;
    }
    return client.query(analyticsBenchmarkRequest);
  }, [analyticsBenchmarkRequest, client]);

  const { data } = useApiRequest(makeBenchmarkRequest);

  return useMemo(() => {
    const benchmarkData = data?.result ?? null;

    // When benchmarkType is specified, the server already returns filtered data.
    // Only apply client-side filtering as a fallback for older backends.
    const resultData =
      benchmarkOverlayType && !apiBenchmarkType
        ? filterBenchmarkResultByType(benchmarkData, benchmarkOverlayType)
        : benchmarkData;

    const hasSimilarityBenchmarks = hasBenchmarkType(resultData, BenchmarkType.Similarity);
    return {
      data: resultData,
      hasSimilarityBenchmarks,
      hasBenchmarks: hasAnyBenchmarks(resultData),
    };
  }, [data, benchmarkOverlayType, apiBenchmarkType]);
};

export default useAnalyticsBenchmarks;
