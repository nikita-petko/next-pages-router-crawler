import { Configuration } from '@rbx/clients';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
// eslint-disable-next-line no-restricted-imports -- Legacy APIs
import {
  AggregationMetadataResponse,
  FeaturePermissionsApi,
  FeaturePermissionsGetFeaturePermissionRequest,
  FeaturePermissionsResponse,
  UniverseAnalyticsAggregationsApi,
  QueryResponse as RAQIUnvalidatedQueryResponse,
  MetricValue as RAQIUnvalidatedMetricValue,
  BreakdownValue as RAQIUnvalidatedBreakdownValue,
  Datapoint as RAQIUnvalidatedDatapoint,
  OpenIssue as AnalyticsChartOpenIssue,
  Dimension,
  AvatarMonetizationDetailsRequest,
  AvatarMonetizationDetailsResponse,
  OwnerType,
  AvatarMonetizationDetail,
  SalesType as AvatarItemSalesType,
  AvatarMonetizationDetailsSortOrder as AvatarItemDetailsSortOrder,
  AvatarMonetizationDetailsApi,
  AvatarMonetizationMetricsApi,
  AvatarMonetizationQueryRequest,
  MetricGranularity,
  AvatarMonetizationMetric as AvatarItemMetric,
  AvatarMonetizationDetailsDimension as AvatarItemDetailsDimension,
  AvatarMonetizationDetailsFilter as AvatarItemDetailsFilter,
  FeaturePermissionsGetFeatureFlagsRequest,
  FeatureFlagsResponse,
  AnalyticsHomeGetAnalyticsHomeTabOrderRequest,
  AnalyticsHomeOrderResponse,
  AnalyticsHomeApi,
  AnalyticsHomeTab,
  MonetizationDetail,
  MonetizationDetailsApi,
  MonetizationDetailsResponse,
  MonetizationDetailsGetTopItemsRequest,
  MonetizationDetailsSortOrder,
  MonetizationDetailsDimension,
  MonetizationDetailType,
} from '@rbx/clients/developerAnalyticsAggregations/v1';

import { getBEDEV2ServiceBasePath } from '../utils';
import { AvatarItemType } from './avatarItemTypes';
import { ItemMonetizationProductTypes } from './monetizationProductTypes';
import ItemMonetizationProductTypesToDetailType from './itemMonetizationProductTypesToDetailType';

const basePath = getBEDEV2ServiceBasePath('developer-analytics-aggregations');

const configuration = new Configuration({
  robloxSiteDomain: process.env.robloxSiteDomain,
  basePath,
  credentials: 'include',
  unifiedLogger: unifiedLoggerClient,
});

const universeAnalyticsAggregationsApi = new UniverseAnalyticsAggregationsApi(configuration);

const featurePermissionsApi = new FeaturePermissionsApi(configuration);

const avatarItemDetailsApi = new AvatarMonetizationDetailsApi(configuration);

const avatarItemMetricsApi = new AvatarMonetizationMetricsApi(configuration);

const analyticsHomeApi = new AnalyticsHomeApi(configuration);

const monetizationDetailsApi = new MonetizationDetailsApi(configuration);

const CastIfDefined = <T>(value: unknown): T | null => (value ? (value as T) : null);

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
 * Override avatar item requests with custom enum types.
 */

type AvatarItemDetailsRequest = AvatarMonetizationDetailsRequest & {
  ownerId: number;
  ownerType: OwnerType;
};
type AvatarItemDetail = AvatarMonetizationDetail & {
  targetType?: AvatarItemType | null;
};
type AvatarItemDetailsResponse = Omit<AvatarMonetizationDetailsResponse, 'values'> & {
  values?: Array<AvatarItemDetail> | null;
};

type AvatarItemMetricsRequest = AvatarMonetizationQueryRequest & {
  ownerId: number;
  ownerType: OwnerType;
};

/**
 * Override item monetization requests with custom enum types.
 */

type MonetizationItemDetail = MonetizationDetail & {
  targetType: AvatarItemType | null;
};
type BaseMonetizationDetailsResponse = {
  total?: MonetizationDetailsResponse['total'];
  nextPaginationToken?: MonetizationDetailsResponse['nextPaginationToken'];
};
type MonetizationItemDetailsResponse = BaseMonetizationDetailsResponse & {
  values: Array<MonetizationItemDetail> | null;
};

// NOTE(shumingxu, 11/10/2023): Move universeId property one level down to support usePaginatedRequest
// and replace monetizationDetailType with ItemMonetizationProductTypes for type consistency
type MonetizationItemDetailsRequest = Omit<
  MonetizationDetailsGetTopItemsRequest,
  'monetizationDetailType'
> & {
  universeId: number;
  productType: ItemMonetizationProductTypes;
};

export {
  Dimension as AllRAQIDimensions,
  StaticInsightType,
  OwnerType,
  AvatarItemDetailsSortOrder,
  MetricGranularity,
  AvatarItemMetric,
  AvatarItemDetailsDimension,
  AnalyticsHomeTab,
  AvatarItemSalesType,
  MonetizationDetailsSortOrder,
  MonetizationDetailsDimension,
  MonetizationDetailType,
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
  AvatarItemDetailsRequest,
  AvatarItemDetailsResponse,
  AvatarItemDetail,
  AvatarItemMetricsRequest,
  AvatarItemDetailsFilter,
  MonetizationItemDetail,
  MonetizationItemDetailsRequest,
  MonetizationItemDetailsResponse,
};

export type DeveloperAnalyticsAggregationsClient = {
  getUniverseAnalyticsAggregationsMetadata(): Promise<AggregationMetadataResponse>;

  getfeaturePermissionsGetFeaturePermission(
    GetFeaturePermissionAsyncRequest: FeaturePermissionsGetFeaturePermissionRequest,
  ): Promise<FeaturePermissionsResponse>;

  getfeaturePermissionsGetFeatureFlags(
    GetFeatureFlagsAsyncRequest: FeaturePermissionsGetFeatureFlagsRequest,
  ): Promise<FeatureFlagsResponse>;

  getAvatarItemDetails(request: AvatarItemDetailsRequest): Promise<AvatarItemDetailsResponse>;
  getAvatarItemMetrics(request: AvatarItemMetricsRequest): Promise<RAQIUnvalidatedQueryResponse>;
  getAnalyticsHomeTabOrder(
    request: AnalyticsHomeGetAnalyticsHomeTabOrderRequest,
  ): Promise<AnalyticsHomeOrderResponse>;
  getItemMonetizationDetails(
    request: MonetizationItemDetailsRequest,
  ): Promise<MonetizationItemDetailsResponse>;
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

  getAvatarItemDetails(request): Promise<AvatarItemDetailsResponse> {
    return avatarItemDetailsApi
      .avatarMonetizationDetailsGetTopAvatarItems({
        ownerId: request.ownerId,
        ownerType: request.ownerType,
        avatarMonetizationDetailsGetTopAvatarItemsRequest: {
          ...request,
        } as AvatarMonetizationDetailsRequest,
      })
      .then((result) => ({
        ...result,
        values: result?.values?.map((value) => ({
          ...value,
          targetType: CastIfDefined(value.targetType),
        })),
      }));
  },
  getAvatarItemMetrics(request: AvatarItemMetricsRequest): Promise<RAQIUnvalidatedQueryResponse> {
    return avatarItemMetricsApi.avatarMonetizationMetricsQueryMetric({
      ownerId: request.ownerId,
      ownerType: request.ownerType,
      avatarMonetizationMetricsQueryMetricRequest: { ...request } as AvatarItemMetricsRequest,
    });
  },
  getAnalyticsHomeTabOrder(
    request: AnalyticsHomeGetAnalyticsHomeTabOrderRequest,
  ): Promise<AnalyticsHomeOrderResponse> {
    return analyticsHomeApi.analyticsHomeGetAnalyticsHomeTabOrder(request);
  },
  getItemMonetizationDetails(
    request: MonetizationItemDetailsRequest,
  ): Promise<MonetizationItemDetailsResponse> {
    return monetizationDetailsApi
      .monetizationDetailsGetTopItems({
        universeId: request.universeId,
        monetizationDetailsGetTopItemsRequest: {
          ...request,
          monetizationDetailType: ItemMonetizationProductTypesToDetailType[request.productType],
        },
      })
      .then((result) => ({
        ...result,
        values:
          result?.values?.map((value) => ({
            ...value,
            targetType: CastIfDefined(value.targetType),
          })) ?? null,
      }));
  },
};

export default developerAnalyticsAggregationsClient;
