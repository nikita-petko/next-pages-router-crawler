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
  buildAnalyticsQueryRequest,
  getPlaysMetricForReportingView,
  getRevenueMetricForReportingView,
  getSpendMetricForReportingView,
} from '@services/ads/analyticsQueryBuilder';
import { aggregateQueryResultToDailyDataPoints } from '@services/ads/campaignTimeSeriesDataPoints';
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
  adAccountId: string,
  campaignId: string,
  requestTimestamp: string,
  timePeriod: DateFilteringTimePeriod,
  timezoneDbName: string,
  unifiedAttributionCutoverDate: string | undefined,
  pollingOptions: RAQIClientOptions,
): Promise<QueryResult> => {
  const request = buildAnalyticsQueryRequest({
    adAccountId,
    campaignId,
    metric,
    requestTimestamp,
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
  adAccountId: string;
  campaignId: string;
  // When true, also queries spend and revenue (required for the ROAS chart).
  // When false, only plays is queried.
  isRoasEnabled: boolean;
  pollingOptions?: RAQIClientOptions;
  reportingView?: ReportingViewType;
  requestTimestamp: string;
  timePeriod: DateFilteringTimePeriod;
  timezoneDbName: string;
  unifiedAttributionCutoverDate?: string;
}

export const getCampaignTimeSeries = async ({
  adAccountId,
  campaignId,
  isRoasEnabled,
  pollingOptions = ANALYTICS_POLLING_DEFAULTS,
  reportingView = ReportingViewType.REPORTING_VIEW_TYPE_DEFAULT,
  requestTimestamp,
  timePeriod,
  timezoneDbName,
  unifiedAttributionCutoverDate,
}: GetCampaignTimeSeriesRequest): Promise<CampaignTimeSeries> => {
  const fetchMetric = (metric: string) =>
    queryMetric(
      metric,
      adAccountId,
      campaignId,
      requestTimestamp,
      timePeriod,
      timezoneDbName,
      unifiedAttributionCutoverDate,
      pollingOptions,
    ).then((queryResult) => aggregateQueryResultToDailyDataPoints(queryResult));

  // Plays is the baseline series; failing to fetch it rejects the whole call
  // so the chart shows its generic error state instead of an empty plot.
  const playsPromise = fetchMetric(getPlaysMetricForReportingView(reportingView));

  // Spend + revenue are only used together (to compute ROAS). Query the
  // reporting-view-specific CAaaS metrics (same pairing as AMSv2 aggregate ROAS)
  // and treat them as a single unit: if either fails, drop both.
  const roasPromise: Promise<{
    revenue?: CampaignTimeSeriesDataPoints;
    spend?: CampaignTimeSeriesDataPoints;
  }> = isRoasEnabled
    ? Promise.all([
        fetchMetric(getSpendMetricForReportingView(reportingView)),
        fetchMetric(getRevenueMetricForReportingView(reportingView)),
      ])
        .then(([spend, revenue]) => ({ revenue, spend }))
        .catch((error) => {
          CaptureException(error as Error, {
            context: 'getCampaignTimeSeries: ROAS metrics (spend/revenue) fetch failed',
          });
          return {};
        })
    : Promise.resolve({});

  const [plays, { revenue, spend }] = await Promise.all([playsPromise, roasPromise]);
  return { plays, revenue, spend };
};
