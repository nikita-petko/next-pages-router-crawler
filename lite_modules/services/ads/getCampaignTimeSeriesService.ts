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
} from '@services/ads/analyticsQueryBuilder';
import {
  aggregateQueryResultToDailyDataPoints,
  queryResultToDailyDirectDataPoints,
} from '@services/ads/campaignTimeSeriesDataPoints';
import { CampaignTimeSeries } from '@type/timeSeries';
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
): Promise<QueryResult> => {
  const request = buildAnalyticsQueryRequest({
    breakdownByAttributionDate,
    campaignId,
    customEndDate,
    customStartDate,
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

interface GetCampaignTimeSeriesRequest {
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
    );

  // Plays is the baseline series; failing to fetch it rejects the whole call
  // so the chart shows its generic error state instead of an empty plot.
  const playsPromise = fetchMetric(getPlaysMetricForReportingView(reportingView)).then(
    aggregateQueryResultToDailyDataPoints,
  );

  const shouldQueryRoas =
    isRoasEnabled && reportingView === ReportingViewType.REPORTING_VIEW_TYPE_DEFAULT;
  const roasPromise: Promise<Pick<CampaignTimeSeries, 'roas' | 'totalRoas'>> = shouldQueryRoas
    ? Promise.all([
        fetchMetric('AdsUARoas', 'oneDay', false),
        fetchMetric('AdsUARoas', 'none', false),
      ])
        .then(([dailyResult, totalResult]) => {
          const totalRoas = totalResult.values
            ?.flatMap((value) => value.dataPoints ?? [])
            .find((dataPoint) => typeof dataPoint.value === 'number')?.value;
          return {
            roas: queryResultToDailyDirectDataPoints(dailyResult),
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
