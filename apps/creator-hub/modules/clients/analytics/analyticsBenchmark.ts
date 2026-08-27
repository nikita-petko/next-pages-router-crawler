import type {
  BenchmarkQuery,
  QueryBenchmarkResponse,
  QueryBenchmarkResult,
  MetricValue,
  DataPointMetadata,
  BreakdownFilter,
} from '@rbx/client-analytics-benchmark-api/v1';
import {
  AnalyticsBenchmarkAPIApi,
  ResourceType,
  BenchmarkType,
} from '@rbx/client-analytics-benchmark-api/v1';
import type { RAQIV2BenchmarkVariantId, TRAQIV2APIMetric } from '@rbx/creator-hub-analytics-config';
import { createClientConfiguration } from '../utils/createClientConfiguration';
import type { ChartResourceType } from './analyticsRAQIShared';
import { mapChartResourceTypeToTargetResourceType } from './analyticsRAQIShared';

const configuration = createClientConfiguration('analytics-benchmark', 'bedev2');

const analyticsBenchmarkApi = new AnalyticsBenchmarkAPIApi(configuration);

export type TL7RAQIV2Metric = `L7${TRAQIV2APIMetric}`;
export const convertToTL7RAQIV2Metric = (metric: TRAQIV2APIMetric): TL7RAQIV2Metric => {
  return `L7${metric}`;
};

export enum AnalyticsBenchmarkMetric {
  DailyRewardedActiveSpendersPercentage = 'DailyRewardedActiveSpendersPercentage',
  RewardedSignupsPercentage = 'RewardedSignupsPercentage',
  RewardedReactivationsPercentage = 'RewardedReactivationsPercentage',
}

type AnalyticsBenchmarkQuery = {
  resourceType: ChartResourceType;
  resourceId: string;
  metric: TL7RAQIV2Metric | TRAQIV2APIMetric | AnalyticsBenchmarkMetric;
  startTime: Date;
  endTime: Date;
  filter?: BreakdownFilter[];
  percentiles?: [number, number];
  benchmarkType?: BenchmarkType;
  // Optional CAaaS registry variant. When set, `metric` is the base metric and
  // the server resolves the leftover overlay dataset. Omit it to keep `metric`
  // as the dataset key itself.
  benchmarkVariantId?: RAQIV2BenchmarkVariantId;
};

export type AnalyticsBenchmarkClientWrapper = {
  query(query: AnalyticsBenchmarkQuery): Promise<QueryBenchmarkResponse>;
};

export type {
  QueryBenchmarkResponse,
  QueryBenchmarkResult,
  AnalyticsBenchmarkQuery,
  MetricValue,
  DataPointMetadata,
  BreakdownFilter,
};
export { BenchmarkType };
export type ValidAnalyticsBenchmarkType = Exclude<BenchmarkType, 'BENCHMARK_TYPE_INVALID'>;

export enum BenchmarkPercentile {
  P0 = '0',
  P25 = '25',
  P50 = '50',
  P75 = '75',
  P90 = '90',
  P95 = '95',
  P98 = '98',
}

const analyticsBenchmarkClient: AnalyticsBenchmarkClientWrapper = {
  query: (query) => {
    const benchmarkQuery: BenchmarkQuery = {
      metric: query.metric,
      startTime: query.startTime.toISOString(),
      endTime: query.endTime.toISOString(),
      filter: query.filter,
      percentiles: query.percentiles,
      benchmarkType: query.benchmarkType,
    };
    if (query.benchmarkVariantId != null) {
      benchmarkQuery.benchmarkVariantId = query.benchmarkVariantId;
    }
    return analyticsBenchmarkApi.v1BenchmarksResourceResourceTypeIdResourceIdPost({
      resourceType: mapChartResourceTypeToTargetResourceType(query.resourceType, ResourceType),
      resourceId: query.resourceId,
      v1BenchmarksResourceResourceTypeIdResourceIdPostRequest: benchmarkQuery,
    });
  },
};

export default analyticsBenchmarkClient;
