import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import {
  Configuration,
  QueryBenchmarkResponse,
  QueryBenchmarkResult,
  AnalyticsBenchmarkAPIApi,
  ResourceType,
  MetricValue,
  BenchmarkType,
  DataPointMetadata,
  BreakdownFilter,
} from '@rbx/client-analytics-benchmark-api/v1';
import { TRAQIV2APIMetric } from '@rbx/creator-hub-analytics-config';
import { getBEDEV2ServiceBasePath } from '../utils';
import { ChartResourceType, mapChartResourceTypeToTargetResourceType } from './analyticsRAQIShared';

const basePath = getBEDEV2ServiceBasePath('analytics-benchmark');

const configuration = new Configuration({
  robloxSiteDomain: process.env.robloxSiteDomain,
  basePath,
  credentials: 'include',
  unifiedLogger: unifiedLoggerClient,
});

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
    return analyticsBenchmarkApi.v1BenchmarksResourceResourceTypeIdResourceIdPost({
      resourceType: mapChartResourceTypeToTargetResourceType(query.resourceType, ResourceType),
      resourceId: query.resourceId,
      benchmarkQuery: {
        metric: query.metric,
        startTime: query.startTime.toISOString(),
        endTime: query.endTime.toISOString(),
        filter: query.filter,
        percentiles: query.percentiles,
        benchmarkType: query.benchmarkType,
      },
    });
  },
};

export default analyticsBenchmarkClient;
