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
  METRIC_EARNINGS_USD_DEFAULT_VIEW,
  METRIC_ROAS_ESTIMATE,
  METRIC_SPEND_MICRO_USD_DEFAULT_VIEW,
  MS_PER_DAY,
  ROAS_VALIDATED_MIN_AGE_DAYS,
} from '@services/ads/analyticsQueryBuilder';
import {
  aggregateQueryResultToDailyDataPoints,
  computeDailyRoasFromAggregates,
  queryResultToDailyDirectDataPoints,
} from '@services/ads/campaignTimeSeriesDataPoints';
import { getAdvertiserTimeSeriesRange } from '@services/ads/campaignTimeSeriesDateRange';
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
  campaignId: string;
  /** YYYY-MM-DD, required (with customStartDate) when timePeriod === CUSTOM. */
  customEndDate?: string;
  customStartDate?: string;
  // When true, composes daily validated ROAS from revenue + spend for the
  // Default View, and fetches the ML-estimated ROAS alongside it.
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
  const playsPromise = fetchMetric(getPlaysMetricForReportingView(reportingView)).then((result) =>
    aggregateQueryResultToDailyDataPoints(result),
  );

  const shouldQueryRoas =
    isRoasEnabled && reportingView === ReportingViewType.REPORTING_VIEW_TYPE_DEFAULT;
  // Symmetric short-circuit around the 31-day attribution boundary, mirroring
  // the scalar table cell's request-batching in `newFlowStoreProvider`:
  // - Whole range inside open window (oldest day <31d old): skip revenue+spend;
  //   every validated bucket would be null-gated in
  //   `computeDailyRoasFromAggregates` and the estimate carries the chart.
  // - Whole range past the boundary (newest day ≥31d old): skip the estimate;
  //   every bucket qualifies for validated. Any missing-spend gaps stay null
  //   because the estimate DAG doesn't retain matured predictions anyway.
  // Mixed ranges that straddle the boundary fetch both.
  const now = new Date(requestTimestamp);
  const { endTime: rangeEndTime, startTime: rangeStartTime } = getAdvertiserTimeSeriesRange(
    requestTimestamp,
    timePeriod,
    timezoneDbName,
    { customEndDate, customStartDate, unifiedAttributionCutoverDate },
  );
  const openWindowCutoffMs = now.getTime() - ROAS_VALIDATED_MIN_AGE_DAYS * MS_PER_DAY;
  const shouldQueryValidatedRoas =
    shouldQueryRoas && rangeStartTime.getTime() <= openWindowCutoffMs;
  const shouldQueryEstimatedRoas = shouldQueryRoas && rangeEndTime.getTime() > openWindowCutoffMs;
  const roasPromise: Promise<Pick<CampaignTimeSeries, 'roas'>> = shouldQueryRoas
    ? Promise.all([
        shouldQueryValidatedRoas
          ? fetchMetric(METRIC_EARNINGS_USD_DEFAULT_VIEW, 'oneDay', true)
          : Promise.resolve(undefined),
        shouldQueryValidatedRoas
          ? fetchMetric(METRIC_SPEND_MICRO_USD_DEFAULT_VIEW, 'oneDay', true)
          : Promise.resolve(undefined),
        // `buildAnalyticsQueryRequest` appends the `ByUniverse` suffix
        // automatically for universe resources, so the same metric names work
        // for both ad-account and universe callers.
        shouldQueryEstimatedRoas
          ? fetchMetric(METRIC_ROAS_ESTIMATE, 'oneDay', false, false).catch((error) => {
              CaptureException(error as Error, {
                context: 'getCampaignTimeSeries: estimated ROAS fetch failed',
              });
              return undefined;
            })
          : Promise.resolve(undefined),
      ])
        .then(([revenueResult, spendResult, estimateResult]) => {
          const validatedDaily =
            revenueResult && spendResult
              ? computeDailyRoasFromAggregates(
                  aggregateQueryResultToDailyDataPoints(revenueResult),
                  aggregateQueryResultToDailyDataPoints(spendResult),
                  now,
                )
              : [];
          const estimatedDaily = estimateResult
            ? queryResultToDailyDirectDataPoints(estimateResult)
            : [];
          return { roas: mergeRoasPreferValidated(validatedDaily, estimatedDaily) };
        })
        .catch((error) => {
          CaptureException(error as Error, {
            context: 'getCampaignTimeSeries: ROAS composition failed',
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
