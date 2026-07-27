import {
  FilterOperation,
  QueryFilter,
  ResourceType,
  V1MetricsResourceResourceTypeIdResourceIdPostRequest,
} from '@rbx/client-analytics-query-gateway/v1';

import DateFilteringTimePeriod from '@constants/dateFilteringTimePeriod';
import ReportingViewType from '@constants/reportingViewType';
import { getAdvertiserTimeSeriesRange } from '@services/ads/campaignTimeSeriesDateRange';

const METRIC_GRANULARITY_ONE_DAY = 'METRIC_GRANULARITY_ONE_DAY';
const METRIC_GRANULARITY_NONE = 'METRIC_GRANULARITY_NONE';
const DIMENSION_CAMPAIGN_ID = 'CampaignId';
const DIMENSION_AD_ID = 'AdId';
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

// Spend uses the "user" suffix family; revenue uses the "view" suffix family —
// same pairing AMSv2 uses for aggregate ROAS (ads_reporting_data_layer.go).
const SPEND_METRIC_BY_REPORTING_VIEW: Partial<Record<ReportingViewType, string>> = {
  [ReportingViewType.REPORTING_VIEW_TYPE_30D_RESURRECTED]:
    'AdsUATotalSpendMicroUsdResurrected30dUsers',
  [ReportingViewType.REPORTING_VIEW_TYPE_7D_RESURRECTED]:
    'AdsUATotalSpendMicroUsdResurrected7dUsers',
  [ReportingViewType.REPORTING_VIEW_TYPE_DEFAULT]: METRIC_SPEND,
  [ReportingViewType.REPORTING_VIEW_TYPE_NEW_USERS]: 'AdsUATotalSpendMicroUsdNewUsers',
  [ReportingViewType.REPORTING_VIEW_TYPE_RECENT_USERS]: 'AdsUATotalSpendMicroUsdReturningUsers',
};

const REVENUE_METRIC_BY_REPORTING_VIEW: Partial<Record<ReportingViewType, string>> = {
  [ReportingViewType.REPORTING_VIEW_TYPE_30D_RESURRECTED]:
    'AdsUARobuxRevenueResurrected30dUserView',
  [ReportingViewType.REPORTING_VIEW_TYPE_7D_RESURRECTED]: 'AdsUARobuxRevenueResurrected7dUserView',
  [ReportingViewType.REPORTING_VIEW_TYPE_DEFAULT]: METRIC_REVENUE,
  [ReportingViewType.REPORTING_VIEW_TYPE_NEW_USERS]: 'AdsUARobuxRevenueNewUserView',
  [ReportingViewType.REPORTING_VIEW_TYPE_RECENT_USERS]: 'AdsUARobuxRevenueReturningUserView',
};

export const getSpendMetricForReportingView = (
  reportingView: ReportingViewType = ReportingViewType.REPORTING_VIEW_TYPE_DEFAULT,
): string => SPEND_METRIC_BY_REPORTING_VIEW[reportingView] ?? METRIC_SPEND;

export const getRevenueMetricForReportingView = (
  reportingView: ReportingViewType = ReportingViewType.REPORTING_VIEW_TYPE_DEFAULT,
): string => REVENUE_METRIC_BY_REPORTING_VIEW[reportingView] ?? METRIC_REVENUE;

interface BuildAnalyticsQueryRequestParams {
  adAccountId: string;
  campaignId: string;
  /** YYYY-MM-DD, required (with customStartDate) when timePeriod === CUSTOM. */
  customEndDate?: string;
  customStartDate?: string;
  metric: string;
  requestTimestamp: string;
  timePeriod: DateFilteringTimePeriod;
  timezoneDbName: string;
  unifiedAttributionCutoverDate?: string;
}

export type UniverseReportingMetric =
  | 'clicks'
  | 'impressions'
  | 'plays'
  | 'playtime'
  | 'revenue'
  | 'spend';

interface BuildUniverseAnalyticsQueryRequestParams {
  endTime: Date;
  entityIds?: string[];
  entityType?: 'ad' | 'campaign';
  metric: UniverseReportingMetric;
  reportingView: ReportingViewType;
  startTime: Date;
  universeId: number;
}

const REPORTING_VIEW_SUFFIXES: Partial<Record<ReportingViewType, { user: string; view: string }>> =
  {
    [ReportingViewType.REPORTING_VIEW_TYPE_30D_RESURRECTED]: {
      user: 'Resurrected30dUsers',
      view: 'Resurrected30dUserView',
    },
    [ReportingViewType.REPORTING_VIEW_TYPE_7D_RESURRECTED]: {
      user: 'Resurrected7dUsers',
      view: 'Resurrected7dUserView',
    },
    [ReportingViewType.REPORTING_VIEW_TYPE_DEFAULT]: {
      user: 'DefaultView',
      view: 'DefaultView',
    },
    [ReportingViewType.REPORTING_VIEW_TYPE_NEW_USERS]: {
      user: 'NewUsers',
      view: 'NewUserView',
    },
    [ReportingViewType.REPORTING_VIEW_TYPE_RECENT_USERS]: {
      user: 'ReturningUsers',
      view: 'ReturningUserView',
    },
  };

const getUniverseMetricName = (
  metric: UniverseReportingMetric,
  reportingView: ReportingViewType,
): string => {
  const suffix =
    REPORTING_VIEW_SUFFIXES[reportingView] ??
    REPORTING_VIEW_SUFFIXES[ReportingViewType.REPORTING_VIEW_TYPE_DEFAULT]!;
  const metricPrefix: Record<UniverseReportingMetric, string> = {
    clicks: `AdsUANumClicks${suffix.user}`,
    impressions: `AdsUANumImpressions${suffix.user}`,
    plays: `AdsUANumPlays${suffix.view}`,
    playtime: `AdsUAPlaytime${suffix.view}`,
    revenue: `AdsUARobuxRevenue${suffix.view}`,
    spend: `AdsUATotalSpendMicroUsd${suffix.user}`,
  };
  return `${metricPrefix[metric]}ByUniverse`;
};

/**
 * Builds the universe-authorized CAaaS request used by page-scoped reporting.
 * AttributionDateHour uses a strict exclusive end so the advertiser-local
 * midnight row cannot overlap the EaaS current-day bucket.
 */
export const buildUniverseAnalyticsQueryRequest = ({
  endTime,
  entityIds,
  entityType,
  metric,
  reportingView,
  startTime,
  universeId,
}: BuildUniverseAnalyticsQueryRequestParams): V1MetricsResourceResourceTypeIdResourceIdPostRequest => {
  const resourceFields = {
    resourceId: String(universeId),
    resourceType: ResourceType.Universe,
  };
  let entityDimension: string | undefined;
  if (entityType === 'campaign') {
    entityDimension = DIMENSION_CAMPAIGN_ID;
  } else if (entityType === 'ad') {
    entityDimension = DIMENSION_AD_ID;
  }
  const filter: QueryFilter[] = [
    {
      dimension: DIMENSION_ATTRIBUTION_DATE_HOUR,
      operation: FilterOperation.Lt,
      values: [String(endTime.getTime())],
    },
    {
      dimension: DIMENSION_ATTRIBUTION_DATE_HOUR,
      operation: FilterOperation.Gte,
      values: [String(startTime.getTime())],
    },
  ];
  if (entityDimension && entityIds?.length) {
    filter.push({
      dimension: entityDimension,
      operation: FilterOperation.Contains,
      values: entityIds,
    });
  }

  return {
    ...resourceFields,
    queryRequest: {
      ...resourceFields,
      query: {
        breakdown: entityDimension ? [{ dimensions: [entityDimension] }] : [],
        endTime: endTime.toISOString(),
        filter,
        granularity: METRIC_GRANULARITY_NONE,
        metric: getUniverseMetricName(metric, reportingView),
        startTime: startTime.toISOString(),
      },
    },
  };
};

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
  customEndDate,
  customStartDate,
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
    { customEndDate, customStartDate, unifiedAttributionCutoverDate },
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
