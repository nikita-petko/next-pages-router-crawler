import type {
  AggregationMetadataResponse,
  FeaturePermissionsGetFeaturePermissionRequest,
  FeaturePermissionsResponse,
  QueryResponse as RAQIUnvalidatedQueryResponse,
  MetricValue as RAQIUnvalidatedMetricValue,
  BreakdownValue as RAQIUnvalidatedBreakdownValue,
  Datapoint as RAQIUnvalidatedDatapoint,
  OpenIssue as AnalyticsChartOpenIssue,
  AvatarMonetizationDetail,
  FeaturePermissionsGetFeatureFlagsRequest,
  FeatureFlagsResponse,
  AnalyticsHomeGetAnalyticsHomeTabOrderRequest,
  AnalyticsHomeOrderResponse,
} from '@rbx/client-developer-analytics-aggregations/v1';
import {
  FeaturePermissionsApi,
  UniverseAnalyticsAggregationsApi,
  Dimension,
  OwnerType,
  AvatarMonetizationDetailsSortOrder as AvatarItemDetailsSortOrder,
  MetricGranularity,
  AnalyticsHomeApi,
  AnalyticsHomeTab,
  SalesType,
} from '@rbx/client-developer-analytics-aggregations/v1';
import { createClientConfiguration } from '../utils/createClientConfiguration';
import type { AvatarItemType } from './avatarItemTypes';

const configuration = createClientConfiguration('developer-analytics-aggregations', 'bedev2');

const universeAnalyticsAggregationsApi = new UniverseAnalyticsAggregationsApi(configuration);

const featurePermissionsApi = new FeaturePermissionsApi(configuration);

const analyticsHomeApi = new AnalyticsHomeApi(configuration);

export const EngagementDimension = {
  [Dimension.AgeGroup]: Dimension.AgeGroup,
  [Dimension.Locale]: Dimension.Locale,
  [Dimension.OperatingSystem]: Dimension.OperatingSystem,
  [Dimension.Platform]: Dimension.Platform,
  [Dimension.Country]: Dimension.Country,
  [Dimension.Gender]: Dimension.Gender,
  [Dimension.TopLocales]: Dimension.TopLocales,
  [Dimension.TopCountries]: Dimension.TopCountries,
  [Dimension.IsNewUser]: Dimension.IsNewUser,
  [Dimension.SessionTimeBucket]: Dimension.SessionTimeBucket,
} as const;

export type EngagementDimension = (typeof EngagementDimension)[keyof typeof EngagementDimension];

export type AvatarItemDimension = typeof Dimension.Product;
export const AvatarItemDimension = {
  [Dimension.Product]: Dimension.Product,
} as const;

export type ItemMonetizationDimension = typeof Dimension.Product | typeof Dimension.RevenueSource;
export const ItemMonetizationDimension = {
  [Dimension.Product]: Dimension.Product,
  [Dimension.RevenueSource]: Dimension.RevenueSource,
} as const;

/**
 * Insight types that are specific to the static content displayed in frontend.
 */
enum StaticInsightType {
  OnboardInviteUsers = 'OnboardInviteUsers',
  OnboardImproveCoreLoop = 'OnboardImproveCoreLoop',
  OnboardRegularUpdates = 'OnboardRegularUpdates',
}

/**
 * Override avatar item details with custom enum types. Still consumed by the
 * RAQI V2 homepage avatar items path, which maps gateway data into this shape.
 */
type AvatarItemDetail = AvatarMonetizationDetail & {
  targetType?: AvatarItemType | null;
};

export {
  Dimension as AllRAQIDimensions,
  StaticInsightType,
  OwnerType,
  AvatarItemDetailsSortOrder,
  MetricGranularity,
  AnalyticsHomeTab,
  SalesType,
};
export type {
  AggregationMetadataResponse,
  FeaturePermissionsResponse,
  RAQIUnvalidatedQueryResponse,
  RAQIUnvalidatedMetricValue,
  RAQIUnvalidatedBreakdownValue,
  RAQIUnvalidatedDatapoint,
  FeaturePermissionsGetFeaturePermissionRequest,
  FeatureFlagsResponse,
  AnalyticsChartOpenIssue,
  AvatarItemDetail,
};

export type DeveloperAnalyticsAggregationsClient = {
  getUniverseAnalyticsAggregationsMetadata(): Promise<AggregationMetadataResponse>;

  getfeaturePermissionsGetFeaturePermission(
    GetFeaturePermissionAsyncRequest: FeaturePermissionsGetFeaturePermissionRequest,
  ): Promise<FeaturePermissionsResponse>;

  getfeaturePermissionsGetFeatureFlags(
    GetFeatureFlagsAsyncRequest: FeaturePermissionsGetFeatureFlagsRequest,
  ): Promise<FeatureFlagsResponse>;

  getAnalyticsHomeTabOrder(
    request: AnalyticsHomeGetAnalyticsHomeTabOrderRequest,
  ): Promise<AnalyticsHomeOrderResponse>;
};

const developerAnalyticsAggregationsClient: DeveloperAnalyticsAggregationsClient = {
  getUniverseAnalyticsAggregationsMetadata(): Promise<AggregationMetadataResponse> {
    return universeAnalyticsAggregationsApi.universeAnalyticsAggregationsGetMetadata();
  },

  getfeaturePermissionsGetFeaturePermission(
    GetFeaturePermissionAsyncRequest,
  ): Promise<FeaturePermissionsResponse> {
    return featurePermissionsApi.featurePermissionsGetFeaturePermission(
      GetFeaturePermissionAsyncRequest,
    );
  },

  getfeaturePermissionsGetFeatureFlags(GetFeatureFlagsAsyncRequest): Promise<FeatureFlagsResponse> {
    return featurePermissionsApi.featurePermissionsGetFeatureFlags(GetFeatureFlagsAsyncRequest);
  },

  getAnalyticsHomeTabOrder(
    request: AnalyticsHomeGetAnalyticsHomeTabOrderRequest,
  ): Promise<AnalyticsHomeOrderResponse> {
    return analyticsHomeApi.analyticsHomeGetAnalyticsHomeTabOrder(request);
  },
};

export default developerAnalyticsAggregationsClient;
