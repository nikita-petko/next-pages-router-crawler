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
  AnalyticsDataQualityPolicy,
  AnalyticsReportingResource,
  buildReportingAnalyticsQueryRequest,
  UniverseReportingMetric,
} from '@services/ads/analyticsQueryBuilder';
import { getFrontendReportingTimeSeriesRange } from '@services/ads/campaignTimeSeriesDateRange';
import {
  CaaSReportingMetric,
  CaaSReportingStatsResult,
  RawReportingMetric,
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

interface BaseReportingQueryContext {
  abortSignal?: AbortSignal;
  customEndDate?: string;
  customStartDate?: string;
  entityIds?: string[];
  entityType?: ReportingEntityType;
  includeRoas?: boolean;
  reportingView: ReportingViewType;
  requestTimestamp: string;
  timePeriod: DateFilteringTimePeriod;
}

interface UniverseReportingQueryContext extends BaseReportingQueryContext {
  universeId: number;
}

interface AdAccountReportingQueryContext extends BaseReportingQueryContext {
  adAccountId: string;
}

type ReportingQueryContext = BaseReportingQueryContext & {
  resource: AnalyticsReportingResource;
};

interface MetricQuery {
  endTime: Date;
  failureMetric: CaaSReportingMetric;
  metric: UniverseReportingMetric;
  qualityPolicy: AnalyticsDataQualityPolicy;
  startTime: Date;
  target?: RawReportingMetric;
}

const resultCache = new Map<string, Promise<Record<string, CaaSReportingStatsResult>>>();
const MAX_CACHE_ENTRIES = 100;
const NON_QUERYABLE_METRICS = new Set<CaaSReportingMetric>([
  'fifteenSecVideoViewCount',
  'twoSecVideoViewCount',
]);

const queryMetric = async (
  context: ReportingQueryContext,
  query: MetricQuery,
  pollingOptions: RAQIClientOptions,
  abortSignal?: AbortSignal,
): Promise<QueryResult> => {
  const queryContext =
    !context.entityType && query.target === 'spendMicroUsd'
      ? { ...context, entityType: 'campaign' as const }
      : context;
  const request = buildReportingAnalyticsQueryRequest({
    endTime: query.endTime,
    entityIds: queryContext.entityIds,
    entityType: queryContext.entityType,
    metric: query.metric,
    qualityPolicy: query.qualityPolicy,
    reportingView: queryContext.reportingView,
    resource: queryContext.resource,
    startTime: query.startTime,
  });

  return pollAnalyticsOperation(
    async () => {
      const { operation } =
        await analyticsQueryGatewayApi.v1MetricsResourceResourceTypeIdResourceIdPost(request, {
          signal: abortSignal,
        });
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

export const aggregateReportingQueryResult = (queryResult: QueryResult): Map<string, number> => {
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

const aggregateDirectMetricQueryResult = (queryResult: QueryResult): Map<string, number> => {
  const values = new Map<string, number>();
  (queryResult.values ?? []).forEach((value) => {
    const entityId = getEntityId(value);
    if (entityId === 'RAQI_RESERVED_DIMENSION_VALUES_NO_VALUE') {
      return;
    }
    const directValue = value.dataPoints?.find((dataPoint) => dataPoint.value !== undefined)?.value;
    if (directValue !== undefined) {
      values.set(entityId, directValue);
    }
  });
  return values;
};

const createResult = (): CaaSReportingStatsResult => ({
  // The current universe CAaaS contract does not expose video-view metrics.
  // Keep them unavailable instead of presenting initialized zeroes as totals.
  failedMetrics: ['fifteenSecVideoViewCount', 'twoSecVideoViewCount'],
  stats: { ...EMPTY_RAW_REPORTING_STATS },
});

export const buildMetricQueries = (context: ReportingQueryContext): MetricQuery[] => {
  const { endTime, startTime } = getFrontendReportingTimeSeriesRange(
    context.requestTimestamp,
    context.timePeriod,
    context.customStartDate,
    context.customEndDate,
  );
  const qualityPolicy: AnalyticsDataQualityPolicy = 'combined';

  const queries = [
    {
      endTime,
      failureMetric: 'impressionCount',
      metric: 'impressions',
      qualityPolicy,
      startTime,
      target: 'impressionCount',
    },
    {
      endTime,
      failureMetric: 'clickCount',
      metric: 'clicks',
      qualityPolicy,
      startTime,
      target: 'clickCount',
    },
    {
      endTime,
      failureMetric: 'spendMicroUsd',
      metric: 'spend',
      qualityPolicy,
      startTime,
      target: 'spendMicroUsd',
    },
    {
      endTime,
      failureMetric: 'playCount',
      metric: 'plays',
      qualityPolicy,
      startTime,
      target: 'playCount',
    },
    {
      endTime,
      failureMetric: 'playTimeSeconds7d',
      metric: 'playtime',
      qualityPolicy,
      startTime,
      target: 'playTimeSeconds7d',
    },
    {
      endTime,
      failureMetric: 'robuxRevenue30d',
      metric: 'revenue',
      qualityPolicy,
      startTime,
      target: 'robuxRevenue30d',
    },
  ].filter(
    (query) =>
      context.entityType !== undefined ||
      (query.target !== 'clickCount' && query.target !== 'robuxRevenue30d'),
  ) as MetricQuery[];
  if (
    context.includeRoas &&
    context.entityType === 'campaign' &&
    context.reportingView === ReportingViewType.REPORTING_VIEW_TYPE_DEFAULT
  ) {
    queries.push({
      endTime,
      failureMetric: 'roas',
      metric: 'roas',
      qualityPolicy,
      startTime,
    });
  }
  return queries;
};

const fetchCaaSStats = async (
  context: ReportingQueryContext,
  pollingOptions: RAQIClientOptions,
  abortSignal?: AbortSignal,
): Promise<Record<string, CaaSReportingStatsResult>> => {
  const resultIds = context.entityIds?.length ? context.entityIds : ['summary'];
  const results = Object.fromEntries(resultIds.map((id) => [id, createResult()]));
  const metricQueries = buildMetricQueries(context);
  const settledQueries = await Promise.allSettled(
    metricQueries.map(async (query) => ({
      query,
      totals:
        query.metric === 'roas'
          ? aggregateDirectMetricQueryResult(
              await queryMetric(context, query, pollingOptions, abortSignal),
            )
          : aggregateReportingQueryResult(
              await queryMetric(context, query, pollingOptions, abortSignal),
            ),
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
        summaryResult.campaignSpendMicroUsd = Object.fromEntries(settled.value.totals.entries());
        summaryResult.stats.spendMicroUsd = Object.values(
          summaryResult.campaignSpendMicroUsd,
        ).reduce((total, value) => total + value, 0);
      }
      return;
    }
    settled.value.totals.forEach((value, id) => {
      const result = results[id];
      if (!result) {
        return;
      }
      if (query.metric === 'roas') {
        result.roas = value;
      } else if (query.target) {
        result.stats[query.target] += value;
      }
    });
  });
  return results;
};

const getCaaSReportingStats = (
  context: ReportingQueryContext,
  pollingOptions: RAQIClientOptions = ANALYTICS_POLLING_DEFAULTS,
): Promise<Record<string, CaaSReportingStatsResult>> => {
  const { abortSignal, ...queryContext } = context;
  const cacheKey = JSON.stringify(queryContext);
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
  const request = fetchCaaSStats(queryContext, pollingOptions, abortSignal)
    .then((results) => {
      const hasQueryFailure = Object.values(results).some((result) =>
        result.failedMetrics.some((metric) => !NON_QUERYABLE_METRICS.has(metric)),
      );
      if (hasQueryFailure) {
        resultCache.delete(cacheKey);
      }
      return results;
    })
    .catch((error) => {
      resultCache.delete(cacheKey);
      throw error;
    });
  resultCache.set(cacheKey, request);
  return request;
};

export const getUniverseCaaSReportingStats = (
  context: UniverseReportingQueryContext,
  pollingOptions: RAQIClientOptions = ANALYTICS_POLLING_DEFAULTS,
): Promise<Record<string, CaaSReportingStatsResult>> =>
  getCaaSReportingStats(
    {
      ...context,
      resource: { id: context.universeId, type: 'universe' },
    },
    pollingOptions,
  );

export const getAdAccountCaaSReportingStats = (
  context: AdAccountReportingQueryContext,
  pollingOptions: RAQIClientOptions = ANALYTICS_POLLING_DEFAULTS,
): Promise<Record<string, CaaSReportingStatsResult>> =>
  getCaaSReportingStats(
    {
      ...context,
      resource: { id: context.adAccountId, type: 'adAccount' },
    },
    pollingOptions,
  );
