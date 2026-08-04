import {
  ANALYTICS_POLLING_DEFAULTS,
  pollAnalyticsOperation,
  RAQIClientOptions,
} from '@rbx/analytics-query-gateway-helpers';
import { AnalyticsQueryGatewayAPIApi, QueryResult } from '@rbx/client-analytics-query-gateway/v1';
import { Configuration } from '@rbx/clients-core';

import { csrfTokenInjectionMiddleware } from '@clients/csrfTokenInjectionMiddleware';
import { unifiedLogger } from '@clients/unifiedLogger';
import DateFilteringTimePeriod from '@constants/dateFilteringTimePeriod';
import ReportingViewType from '@constants/reportingViewType';
import {
  buildUniverseAnalyticsQueryRequest,
  UniverseReportingMetric,
} from '@services/ads/analyticsQueryBuilder';
import { getFrontendReportingTimeSeriesRange } from '@services/ads/campaignTimeSeriesDateRange';
import {
  CaaSReportingStatsResult,
  RawReportingMetric,
  RawReportingStats,
} from '@type/reportingStats';
import { EMPTY_RAW_REPORTING_STATS } from '@utils/frontendReportingStats';
import { GetApiSiteBaseUrl, GetSitetestBaseUrl } from '@utils/url';

const analyticsQueryGatewayApi = new AnalyticsQueryGatewayAPIApi(
  new Configuration({
    basePath: `${GetApiSiteBaseUrl()}/analytics-query-gateway`,
    credentials: 'include',
    middleware: [csrfTokenInjectionMiddleware],
    robloxSiteDomain: GetSitetestBaseUrl(),
    unifiedLogger,
  }),
);

type ReportingEntityType = 'ad' | 'campaign';

interface ReportingQueryContext {
  entityIds?: string[];
  entityType?: ReportingEntityType;
  reportingView: ReportingViewType;
  requestTimestamp: string;
  timePeriod: DateFilteringTimePeriod;
  universeId: number;
}

interface MetricQuery {
  endTime: Date;
  failureMetric: RawReportingMetric;
  metric: UniverseReportingMetric;
  startTime: Date;
  target: keyof RawReportingStats;
}

const resultCache = new Map<string, Promise<Record<string, CaaSReportingStatsResult>>>();
const MAX_CACHE_ENTRIES = 100;

const queryMetric = async (
  context: ReportingQueryContext,
  query: MetricQuery,
  pollingOptions: RAQIClientOptions,
): Promise<QueryResult> => {
  const queryContext =
    !context.entityType && query.target === 'spendMicroUsd'
      ? { ...context, entityType: 'campaign' as const }
      : context;
  const request = buildUniverseAnalyticsQueryRequest({
    endTime: query.endTime,
    entityIds: queryContext.entityIds,
    entityType: queryContext.entityType,
    metric: query.metric,
    reportingView: queryContext.reportingView,
    startTime: query.startTime,
    universeId: queryContext.universeId,
  });

  return pollAnalyticsOperation(
    async () => {
      const { operation } =
        await analyticsQueryGatewayApi.v1MetricsResourceResourceTypeIdResourceIdPost(request);
      if (!operation) {
        throw new Error('analytics-query-gateway: no operation in query response');
      }
      return operation;
    },
    (operation) => operation.queryResult,
    pollingOptions,
  );
};

const getEntityId = (queryResultValue: NonNullable<QueryResult['values']>[number]): string =>
  queryResultValue.breakdownValue?.find(
    ({ dimension }) => dimension === 'CampaignId' || dimension === 'AdId',
  )?.value ?? 'summary';

const aggregateQueryResult = (queryResult: QueryResult): Map<string, number> => {
  const totals = new Map<string, number>();
  (queryResult.values ?? []).forEach((value) => {
    const entityId = getEntityId(value);
    if (entityId === 'RAQI_RESERVED_DIMENSION_VALUES_NO_VALUE') {
      return;
    }
    const total = (value.dataPoints ?? []).reduce(
      (sum, dataPoint) => sum + (dataPoint.value ?? 0),
      0,
    );
    totals.set(entityId, (totals.get(entityId) ?? 0) + total);
  });
  return totals;
};

const createResult = (): CaaSReportingStatsResult => ({
  // The current universe CAaaS contract does not expose video-view metrics.
  // Keep them unavailable instead of presenting initialized zeroes as totals.
  failedMetrics: ['fifteenSecVideoViewCount', 'twoSecVideoViewCount'],
  stats: { ...EMPTY_RAW_REPORTING_STATS },
});

const buildMetricQueries = (context: ReportingQueryContext): MetricQuery[] => {
  const { endTime, startTime } = getFrontendReportingTimeSeriesRange(
    context.requestTimestamp,
    context.timePeriod,
  );

  return [
    {
      endTime,
      failureMetric: 'impressionCount',
      metric: 'impressions',
      startTime,
      target: 'impressionCount',
    },
    {
      endTime,
      failureMetric: 'clickCount',
      metric: 'clicks',
      startTime,
      target: 'clickCount',
    },
    {
      endTime,
      failureMetric: 'spendMicroUsd',
      metric: 'spend',
      startTime,
      target: 'spendMicroUsd',
    },
    {
      endTime,
      failureMetric: 'playCount',
      metric: 'plays',
      startTime,
      target: 'playCount',
    },
    {
      endTime,
      failureMetric: 'playTimeSeconds7d',
      metric: 'playtime',
      startTime,
      target: 'playTimeSeconds7d',
    },
    {
      endTime,
      failureMetric: 'robuxRevenue30d',
      metric: 'revenue',
      startTime,
      target: 'robuxRevenue30d',
    },
  ];
};

const fetchCaaSStats = async (
  context: ReportingQueryContext,
  pollingOptions: RAQIClientOptions,
): Promise<Record<string, CaaSReportingStatsResult>> => {
  const resultIds = context.entityIds?.length ? context.entityIds : ['summary'];
  const results = Object.fromEntries(resultIds.map((id) => [id, createResult()]));
  const metricQueries = buildMetricQueries(context);
  const settledQueries = await Promise.allSettled(
    metricQueries.map(async (query) => ({
      query,
      totals: aggregateQueryResult(await queryMetric(context, query, pollingOptions)),
    })),
  );

  settledQueries.forEach((settled, index) => {
    const query = metricQueries[index]!;
    if (settled.status === 'rejected') {
      Object.values(results).forEach((result) => {
        if (!result.failedMetrics.includes(query.failureMetric)) {
          result.failedMetrics.push(query.failureMetric);
        }
      });
      return;
    }
    if (!context.entityType && query.target === 'spendMicroUsd') {
      const summaryResult = results.summary;
      if (summaryResult) {
        summaryResult.campaignSpendMicroUsd = Object.fromEntries(settled.value.totals);
        summaryResult.stats.spendMicroUsd = Array.from(settled.value.totals.values()).reduce(
          (total, value) => total + value,
          0,
        );
      }
      return;
    }
    settled.value.totals.forEach((value, id) => {
      const result = results[id];
      if (!result) {
        return;
      }
      result.stats[query.target] += value;
    });
  });
  return results;
};

export const getUniverseCaaSReportingStats = (
  context: ReportingQueryContext,
  pollingOptions: RAQIClientOptions = ANALYTICS_POLLING_DEFAULTS,
): Promise<Record<string, CaaSReportingStatsResult>> => {
  const cacheKey = JSON.stringify(context);
  const cached = resultCache.get(cacheKey);
  if (cached) {
    return cached;
  }
  if (resultCache.size >= MAX_CACHE_ENTRIES) {
    const oldestCacheKey = resultCache.keys().next().value;
    if (oldestCacheKey !== undefined) {
      resultCache.delete(oldestCacheKey);
    }
  }
  const request = fetchCaaSStats(context, pollingOptions).catch((error) => {
    resultCache.delete(cacheKey);
    throw error;
  });
  resultCache.set(cacheKey, request);
  return request;
};
