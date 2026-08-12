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
const ATTRIBUTION_WINDOW_DAYS = 30;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DIMENSION_CAMPAIGN_ID = 'CampaignId';
const DIMENSION_AD_ID = 'AdId';
const DIMENSION_ATTRIBUTION_DATE_HOUR = 'AttributionDateHour';
const DIMENSION_DATA_QUALITY = 'DataQuality';
const DATA_QUALITY_FINAL = 'Final';

export type AnalyticsDataQualityPolicy = 'combined' | 'final';
export type AnalyticsQueryGranularity = 'none' | 'oneDay';

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
  breakdownByAttributionDate?: boolean;
  campaignId: string;
  /** YYYY-MM-DD, required (with customStartDate) when timePeriod === CUSTOM. */
  customEndDate?: string;
  customStartDate?: string;
  granularity?: AnalyticsQueryGranularity;
  metric: string;
  qualityPolicy?: AnalyticsDataQualityPolicy;
  requestTimestamp: string;
  resource: AnalyticsReportingResource;
  timePeriod: DateFilteringTimePeriod;
  timezoneDbName: string;
  unifiedAttributionCutoverDate?: string;
}

export type UniverseReportingMetric =
  | 'clicks'
  | 'impressions'
  | 'plays'
  | 'playtime'
  | 'roas'
  | 'revenue'
  | 'spend';

export type AnalyticsReportingResource =
  | { id: string; type: 'adAccount' }
  | { id: number; type: 'universe' };

interface BuildReportingAnalyticsQueryRequestParams {
  endTime: Date;
  entityIds?: string[];
  entityType?: 'ad' | 'campaign';
  metric: UniverseReportingMetric;
  qualityPolicy?: AnalyticsDataQualityPolicy;
  reportingView: ReportingViewType;
  resource: AnalyticsReportingResource;
  startTime: Date;
}

interface BuildUniverseAnalyticsQueryRequestParams extends Omit<
  BuildReportingAnalyticsQueryRequestParams,
  'resource'
> {
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

const getReportingMetricName = (
  metric: UniverseReportingMetric,
  reportingView: ReportingViewType,
  resourceType: AnalyticsReportingResource['type'],
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
    roas: 'AdsUARoas',
    spend: `AdsUATotalSpendMicroUsd${suffix.user}`,
  };
  if (metric === 'roas' && reportingView !== ReportingViewType.REPORTING_VIEW_TYPE_DEFAULT) {
    throw new Error('AdsUARoas is only available for the default reporting view');
  }
  return `${metricPrefix[metric]}${resourceType === 'universe' ? 'ByUniverse' : ''}`;
};

export const getAttributionQueryEndTime = (attributionEndTime: Date): Date =>
  new Date(attributionEndTime.getTime() + ATTRIBUTION_WINDOW_DAYS * MS_PER_DAY);

/**
 * Builds the universe-authorized CAaaS request used by page-scoped reporting.
 * AttributionDateHour uses a half-open [start, end) range so a bucket whose
 * timestamp equals the next period's start is not included.
 */
export const buildReportingAnalyticsQueryRequest = ({
  endTime,
  entityIds,
  entityType,
  metric,
  qualityPolicy = 'combined',
  reportingView,
  resource,
  startTime,
}: BuildReportingAnalyticsQueryRequestParams): V1MetricsResourceResourceTypeIdResourceIdPostRequest => {
  const resourceFields = {
    resourceId: String(resource.id),
    resourceType: resource.type === 'universe' ? ResourceType.Universe : ResourceType.AdAccountId,
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
  if (qualityPolicy === 'final') {
    filter.push({
      dimension: DIMENSION_DATA_QUALITY,
      operation: FilterOperation.Equals,
      values: [DATA_QUALITY_FINAL],
    });
  }
  const breakdownDimensions = entityDimension ? [entityDimension] : [];

  return {
    ...resourceFields,
    queryRequest: {
      ...resourceFields,
      query: {
        breakdown: breakdownDimensions.length ? [{ dimensions: breakdownDimensions }] : [],
        endTime: getAttributionQueryEndTime(endTime).toISOString(),
        filter,
        granularity: METRIC_GRANULARITY_NONE,
        metric: getReportingMetricName(metric, reportingView, resource.type),
        startTime: startTime.toISOString(),
      },
    },
  };
};

export const buildUniverseAnalyticsQueryRequest = ({
  universeId,
  ...params
}: BuildUniverseAnalyticsQueryRequestParams): V1MetricsResourceResourceTypeIdResourceIdPostRequest =>
  buildReportingAnalyticsQueryRequest({
    ...params,
    resource: { id: universeId, type: 'universe' },
  });

/**
 * Build a single-metric query request in the typed shape that
 * `AnalyticsQueryGatewayAPIApi.v1MetricsResourceResourceTypeIdResourceIdPost`
 * expects. The resource scope is either the ad account or universe;
 * CampaignId narrows further as a filter. The resource ID is not re-asserted
 * as a filter because it is already the authorization scope.
 */
export const buildAnalyticsQueryRequest = ({
  breakdownByAttributionDate = true,
  campaignId,
  customEndDate,
  customStartDate,
  granularity = 'oneDay',
  metric,
  qualityPolicy = 'combined',
  requestTimestamp,
  resource,
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
    resourceId: String(resource.id),
    resourceType: resource.type === 'universe' ? ResourceType.Universe : ResourceType.AdAccountId,
  };
  const filter: QueryFilter[] = [
    // AttributionDateHour filter values must be epoch-ms strings (parsed as
    // int64 server-side by RoCubeFilterValueParser.ParseOrThrow in
    // developer-analytics/services/analytics-query-engine), even though the
    // top-level query.startTime/query.endTime are ISO 8601 strings.
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
    {
      dimension: DIMENSION_CAMPAIGN_ID,
      operation: FilterOperation.Equals,
      values: [campaignId],
    },
  ];
  if (qualityPolicy === 'final') {
    filter.push({
      dimension: DIMENSION_DATA_QUALITY,
      operation: FilterOperation.Equals,
      values: [DATA_QUALITY_FINAL],
    });
  }

  return {
    ...resourceFields,
    queryRequest: {
      ...resourceFields,
      query: {
        breakdown:
          granularity === 'none' || !breakdownByAttributionDate
            ? []
            : [
                {
                  dimensions: [DIMENSION_ATTRIBUTION_DATE_HOUR],
                },
              ],
        endTime: getAttributionQueryEndTime(endTime).toISOString(),
        filter,
        granularity: granularity === 'none' ? METRIC_GRANULARITY_NONE : METRIC_GRANULARITY_ONE_DAY,
        metric: `${metric}${resource.type === 'universe' ? 'ByUniverse' : ''}`,
        startTime: startTime.toISOString(),
      },
    },
  };
};
