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
  AnalyticsQueryGranularity,
  AnalyticsReportingResource,
  buildAnalyticsQueryRequest,
  getPlaysMetricForReportingView,
  METRIC_ROAS_ESTIMATE,
} from '@services/ads/analyticsQueryBuilder';
import {
  aggregateQueryResultToDailyDataPoints,
  queryResultToDailyDirectDataPoints,
} from '@services/ads/campaignTimeSeriesDataPoints';
import { CampaignTimeSeries, CampaignTimeSeriesDataPoints } from '@type/timeSeries';
import { CaptureException } from '@utils/error';
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

const queryMetric = async (
  metric: string,
  resource: AnalyticsReportingResource,
  campaignId: string,
  requestTimestamp: string,
  timePeriod: DateFilteringTimePeriod,
  timezoneDbName: string,
  unifiedAttributionCutoverDate: string | undefined,
  customStartDate: string | undefined,
  customEndDate: string | undefined,
  pollingOptions: RAQIClientOptions,
  granularity: AnalyticsQueryGranularity = 'oneDay',
  breakdownByAttributionDate: boolean = true,
  extendEndTimeByAttributionWindow: boolean = true,
): Promise<QueryResult> => {
  const request = buildAnalyticsQueryRequest({
    breakdownByAttributionDate,
    campaignId,
    customEndDate,
    customStartDate,
    extendEndTimeByAttributionWindow,
    granularity,
    metric,
    qualityPolicy: 'combined',
    requestTimestamp,
    resource,
    timePeriod,
    timezoneDbName,
    unifiedAttributionCutoverDate,
  });

  return pollAnalyticsOperation(
    async () => {
      const { operation } =
        await analyticsQueryGatewayApi.v1MetricsResourceResourceTypeIdResourceIdPost(request);
      // Matches creator-hub's analyticsQueryGatewayMakeQueryRequest
      if (!operation) {
        throw new Error('analytics-query-gateway: no operation in query response');
      }
      return operation;
    },
    (operation) => operation.queryResult,
    pollingOptions,
  );
};

/** Chart bucketing for the plays series: attribution day or raw conversion day. */
type CampaignTimeSeriesAggregationType = 'attributionDate' | 'default';

/**
 * Merge validated + estimated daily ROAS into a single series, preferring
 * validated where present. The ML DAG only writes estimates for the trailing
 * ~30 days whose attribution windows are still open; validated data lands for
 * those dates as the window closes. During the overlap either can be non-null,
 * and validated is authoritative.
 */
const mergeRoasPreferValidated = (
  validated: CampaignTimeSeriesDataPoints,
  estimated: CampaignTimeSeriesDataPoints,
): CampaignTimeSeriesDataPoints => {
  const merged = new Map<number, number | null>();
  estimated.forEach(([ts, value]) => merged.set(ts, value));
  validated.forEach(([ts, value]) => {
    if (value !== null) {
      merged.set(ts, value);
      return;
    }
    if (!merged.has(ts)) {
      merged.set(ts, null);
    }
  });
  return Array.from(merged.entries()).sort(([a], [b]) => a - b);
};

interface GetCampaignTimeSeriesRequest {
  aggregationType: CampaignTimeSeriesAggregationType;
  campaignId: string;
  /** YYYY-MM-DD, required (with customStartDate) when timePeriod === CUSTOM. */
  customEndDate?: string;
  customStartDate?: string;
  // When true, also queries direct AdsUARoas for the Default View.
  isRoasEnabled: boolean;
  pollingOptions?: RAQIClientOptions;
  reportingView?: ReportingViewType;
  requestTimestamp: string;
  resource: AnalyticsReportingResource;
  timePeriod: DateFilteringTimePeriod;
  timezoneDbName: string;
  unifiedAttributionCutoverDate?: string;
}

export const getCampaignTimeSeries = async ({
  aggregationType,
  campaignId,
  customEndDate,
  customStartDate,
  isRoasEnabled,
  pollingOptions = ANALYTICS_POLLING_DEFAULTS,
  reportingView = ReportingViewType.REPORTING_VIEW_TYPE_DEFAULT,
  requestTimestamp,
  resource,
  timePeriod,
  timezoneDbName,
  unifiedAttributionCutoverDate,
}: GetCampaignTimeSeriesRequest): Promise<CampaignTimeSeries> => {
  const fetchMetric = (
    metric: string,
    granularity: AnalyticsQueryGranularity = 'oneDay',
    breakdownByAttributionDate: boolean = true,
    extendEndTimeByAttributionWindow: boolean = true,
  ) =>
    queryMetric(
      metric,
      resource,
      campaignId,
      requestTimestamp,
      timePeriod,
      timezoneDbName,
      unifiedAttributionCutoverDate,
      customStartDate,
      customEndDate,
      pollingOptions,
      granularity,
      breakdownByAttributionDate,
      extendEndTimeByAttributionWindow,
    );

  // Plays is the baseline series; a failure rejects the whole call.
  const useAttributionDate = aggregationType === 'attributionDate';
  const playsPromise = fetchMetric(
    getPlaysMetricForReportingView(reportingView),
    'oneDay',
    useAttributionDate,
    useAttributionDate,
  ).then((result) =>
    aggregateQueryResultToDailyDataPoints(result, {
      by: useAttributionDate ? 'attributionDate' : 'conversionDate',
    }),
  );

  const shouldQueryRoas =
    isRoasEnabled && reportingView === ReportingViewType.REPORTING_VIEW_TYPE_DEFAULT;
  const roasPromise: Promise<Pick<CampaignTimeSeries, 'roas' | 'totalRoas'>> = shouldQueryRoas
    ? Promise.all([
        fetchMetric('AdsUARoas', 'oneDay', false),
        fetchMetric('AdsUARoas', 'none', false),
        // `ByUniverse` suffix is applied automatically by
        // `buildAnalyticsQueryRequest` for universe resources — mirrors how
        // `AdsUARoas` routes to `AdsUARoasByUniverse` here.
        fetchMetric(METRIC_ROAS_ESTIMATE, 'oneDay', false, false).catch((error) => {
          CaptureException(error as Error, {
            context: 'getCampaignTimeSeries: estimated ROAS fetch failed',
          });
          return undefined;
        }),
      ])
        .then(([dailyResult, totalResult, estimateResult]) => {
          const totalRoas = totalResult.values
            ?.flatMap((value) => value.dataPoints ?? [])
            .find((dataPoint) => typeof dataPoint.value === 'number')?.value;
          const validatedDaily = queryResultToDailyDirectDataPoints(dailyResult);
          const estimatedDaily = estimateResult
            ? queryResultToDailyDirectDataPoints(estimateResult)
            : [];
          return {
            roas: estimatedDaily.length
              ? mergeRoasPreferValidated(validatedDaily, estimatedDaily)
              : validatedDaily,
            totalRoas: typeof totalRoas === 'number' ? totalRoas : undefined,
          };
        })
        .catch((error) => {
          CaptureException(error as Error, {
            context: 'getCampaignTimeSeries: direct ROAS fetch failed',
          });
          return {};
        })
    : Promise.resolve({});

  const [plays, roas] = await Promise.all([playsPromise, roasPromise]);
  return {
    plays,
    ...roas,
  };
};
