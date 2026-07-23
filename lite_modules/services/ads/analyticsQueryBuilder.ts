import {
  FilterOperation,
  ResourceType,
  V1MetricsResourceResourceTypeIdResourceIdPostRequest,
} from '@rbx/client-analytics-query-gateway/v1';

import DateFilteringTimePeriod from '@constants/dateFilteringTimePeriod';
import ReportingViewType from '@constants/reportingViewType';
import { getAdvertiserTimeSeriesRange } from '@services/ads/campaignTimeSeriesDateRange';

const METRIC_GRANULARITY_ONE_DAY = 'METRIC_GRANULARITY_ONE_DAY';
const DIMENSION_CAMPAIGN_ID = 'CampaignId';
const DIMENSION_ATTRIBUTION_DATE_HOUR = 'AttributionDateHour';

export const METRIC_PLAYS = 'AdsUANumPlaysDefaultView';

const PLAYS_METRIC_BY_REPORTING_VIEW: Partial<Record<ReportingViewType, string>> = {
  [ReportingViewType.REPORTING_VIEW_TYPE_30D_RESURRECTED]: 'AdsUANumPlaysResurrected30dUserView',
  [ReportingViewType.REPORTING_VIEW_TYPE_7D_RESURRECTED]: 'AdsUANumPlaysResurrected7dUserView',
  [ReportingViewType.REPORTING_VIEW_TYPE_DEFAULT]: 'AdsUANumPlaysDefaultView',
  [ReportingViewType.REPORTING_VIEW_TYPE_NEW_USERS]: 'AdsUANumPlaysNewUserView',
  [ReportingViewType.REPORTING_VIEW_TYPE_RECENT_USERS]: 'AdsUANumPlaysReturningUserView',
};

/** Plays metric name for the selected reporting view (matches AMSv2 viewTypeSuffixes). */
export const getPlaysMetricForReportingView = (
  reportingView: ReportingViewType = ReportingViewType.REPORTING_VIEW_TYPE_DEFAULT,
): string => PLAYS_METRIC_BY_REPORTING_VIEW[reportingView] ?? METRIC_PLAYS;
export const METRIC_SPEND = 'AdsUATotalSpendMicroUsdDefaultView';
export const METRIC_REVENUE = 'AdsUARobuxRevenueDefaultView';

interface BuildAnalyticsQueryRequestParams {
  adAccountId: string;
  campaignId: string;
  metric: string;
  requestTimestamp: string;
  timePeriod: DateFilteringTimePeriod;
  timezoneDbName: string;
  unifiedAttributionCutoverDate?: string;
}

/**
 * Build a single-metric query request in the typed shape that
 * `AnalyticsQueryGatewayAPIApi.v1MetricsResourceResourceTypeIdResourceIdPost`
 * expects. The resource scope is the ad account
 * (`ResourceType.AdAccountId` / `RESOURCE_TYPE_AD_ACCOUNT_ID = 5` in the
 * proto enum); CampaignId narrows further as a filter. AdAccountId is NOT
 * re-asserted as a filter because it's already the resource scope.
 */
export const buildAnalyticsQueryRequest = ({
  adAccountId,
  campaignId,
  metric,
  requestTimestamp,
  timePeriod,
  timezoneDbName,
  unifiedAttributionCutoverDate,
}: BuildAnalyticsQueryRequestParams): V1MetricsResourceResourceTypeIdResourceIdPostRequest => {
  const { endTime, startTime } = getAdvertiserTimeSeriesRange(
    requestTimestamp,
    timePeriod,
    timezoneDbName,
    unifiedAttributionCutoverDate,
  );

  const resourceFields = {
    resourceId: adAccountId,
    resourceType: ResourceType.AdAccountId,
  };

  return {
    ...resourceFields,
    queryRequest: {
      ...resourceFields,
      query: {
        breakdown: [{ dimensions: [DIMENSION_ATTRIBUTION_DATE_HOUR] }],
        endTime: endTime.toISOString(),
        filter: [
          // AttributionDateHour filter values must be epoch-ms strings (parsed as
          // int64 server-side by RoCubeFilterValueParser.ParseOrThrow in
          // developer-analytics/services/analytics-query-engine), even though the
          // top-level query.startTime/query.endTime are ISO 8601 strings.
          {
            dimension: DIMENSION_ATTRIBUTION_DATE_HOUR,
            operation: FilterOperation.Lte,
            values: [String(endTime.getTime())],
          },
          {
            dimension: DIMENSION_ATTRIBUTION_DATE_HOUR,
            operation: FilterOperation.Gte,
            values: [String(startTime.getTime())],
          },
          {
            dimension: DIMENSION_CAMPAIGN_ID,
            operation: FilterOperation.Equals,
            values: [campaignId],
          },
        ],
        granularity: METRIC_GRANULARITY_ONE_DAY,
        metric,
        startTime: startTime.toISOString(),
      },
    },
  };
};
