import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import { Configuration } from '@rbx/clients-core';
import {
  AnalyticsQueryGatewayAPIApi,
  ExecuteDagRequest as AnalyticsQueryGatewayAPIExecuteDagRequest,
  ExecuteDagResponse as AnalyticsQueryGatewayAPIExecuteDagResponse,
  QueryResult as AnalyticsQueryGatewayAPIQueryResult,
  QueryBreakdown as AnalyticsQueryGatewayAPIQueryBreakdown,
  QueryFilter as AnalyticsQueryGatewayAPIQueryFilter,
  Operation as AnalyticsQueryGatewayAPIOperation,
  ResourceType as AnalyticsQueryGatewayAPIResourceType,
  DimensionValuesResult as AnalyticsQueryGatewayAPIDimensionValuesResult,
  V1MetricsResourceResourceTypeIdResourceIdPostRequest,
  V1DimensionsResourceResourceTypeIdResourceIdPostRequest,
  V1DagExecutePostRequest,
  V1DagValidatePostRequest,
  V1MetricsMetadataPostRequest,
  MetricMetadataResult as AnalyticsQueryGatewayAPIMetricMetadataResult,
  MetricValue as AnalyticsQueryGatewayAPIMetricValue,
  BreakdownValue as AnalyticsQueryGatewayAPIBreakdownValue,
  DataPoint as AnalyticsQueryGatewayAPIDataPoint,
  FilterOperation as AnalyticsQueryGatewayAPIFilterOperation,
  OperationMetadata as AnalyticsQueryGatewayAPIOperationMetadata,
  QueryError as AnalyticsQueryGatewayAPIQueryError,
  BannerConfiguration,
  AnnotationConfiguration,
  ChartWarningConfiguration,
  StatusConfigResponse,
  ValidateDagRequest as AnalyticsQueryGatewayAPIValidateDagRequest,
  ValidateDagResponse as AnalyticsQueryGatewayAPIValidateDagResponse,
  DataStatus as AnalyticsDataStatus,
} from '@rbx/client-analytics-query-gateway/v1';
import {
  TRAQIV2APIMetric,
  RAQIV2Dimension,
  RAQIV2MetricGranularity,
} from '@rbx/creator-hub-analytics-config';
import { getBEDEV2ServiceBasePath } from '../utils';
import { poll, RAQIClientOptions } from './RAQIPolling';
import {
  ChartResource,
  mapChartResourceTypeToTargetResourceType,
  QueryFilter,
  RAQIV2CombinedAPIQueryRequestBase,
} from './analyticsRAQIShared';
import getNamespacedDimensionsForMetrics from './getNamespacedDimensionsForMetrics';

const basePath = getBEDEV2ServiceBasePath('analytics-query-gateway');

const configuration = new Configuration({
  robloxSiteDomain: process.env.robloxSiteDomain,
  basePath,
  credentials: 'include',
  unifiedLogger: unifiedLoggerClient,
});

const analyticsQueryGatewayApi = new AnalyticsQueryGatewayAPIApi(configuration);

export type AnalyticsQueryGatewayAPIQueryRequest = RAQIV2CombinedAPIQueryRequestBase & {
  resource: ChartResource;
};

export type {
  AnalyticsQueryGatewayAPIDataPoint,
  AnalyticsQueryGatewayAPIBreakdownValue,
  AnalyticsQueryGatewayAPIMetricValue,
  AnalyticsQueryGatewayAPIQueryResult,
  AnalyticsQueryGatewayAPIOperationMetadata,
  AnalyticsQueryGatewayAPIQueryError,
  AnalyticsQueryGatewayAPIMetricMetadataResult,
  AnnotationConfiguration,
  BannerConfiguration,
  ChartWarningConfiguration,
};
export { AnalyticsQueryGatewayAPIFilterOperation, AnalyticsDataStatus };
export type {
  AnalyticsQueryGatewayAPIExecuteDagRequest,
  AnalyticsQueryGatewayAPIExecuteDagResponse,
  AnalyticsQueryGatewayAPIValidateDagRequest,
  AnalyticsQueryGatewayAPIValidateDagResponse,
};

export type AnalyticsQueryGatewayGetDimensionValuesRequest = {
  resource: ChartResource;
  metrics: TRAQIV2APIMetric[];
  dimension: RAQIV2Dimension;
  startTime: Date;
  endTime: Date;
  filter?: QueryFilter[];
  granularity?: RAQIV2MetricGranularity;
};
export type { AnalyticsQueryGatewayAPIDimensionValuesResult };

export type AnalyticsQueryGatewayGetMetricMetadataRequest = {
  metrics: TRAQIV2APIMetric[];
};

export type AnalyticsQueryGatewayGetStatusConfigRequest = {
  universeId?: number;
};
export type AnalyticsQueryGatewayGetStatusConfigResult = StatusConfigResponse;

export type AnalyticsQueryGatewayExecuteDagRequest = AnalyticsQueryGatewayAPIExecuteDagRequest;
export type AnalyticsQueryGatewayExecuteDagResult = AnalyticsQueryGatewayAPIExecuteDagResponse;
export type AnalyticsQueryGatewayValidateDagRequest = AnalyticsQueryGatewayAPIValidateDagRequest;
export type AnalyticsQueryGatewayValidateDagResult = AnalyticsQueryGatewayAPIValidateDagResponse;

export type AnalyticsQueryGatewayClientWrapper = {
  query(
    queryRequest: AnalyticsQueryGatewayAPIQueryRequest,
  ): Promise<AnalyticsQueryGatewayAPIQueryResult>;
  getDimensionValues: (
    request: AnalyticsQueryGatewayGetDimensionValuesRequest,
  ) => Promise<AnalyticsQueryGatewayAPIDimensionValuesResult>;
  getMetricMetadata: (
    request: AnalyticsQueryGatewayGetMetricMetadataRequest,
  ) => Promise<AnalyticsQueryGatewayAPIMetricMetadataResult>;
  getStatusConfig: (
    request: AnalyticsQueryGatewayGetStatusConfigRequest,
  ) => Promise<AnalyticsQueryGatewayGetStatusConfigResult>;
  executeDag: (
    request: AnalyticsQueryGatewayExecuteDagRequest,
  ) => Promise<AnalyticsQueryGatewayExecuteDagResult>;
  validateDag: (
    request: AnalyticsQueryGatewayValidateDagRequest,
  ) => Promise<AnalyticsQueryGatewayValidateDagResult>;
};

const analyticsQueryGatewayOperationResponseToResult = ({
  queryResult,
}: AnalyticsQueryGatewayAPIOperation) => {
  if (!queryResult) {
    throw new Error('Error: no query result in analytics-query-gateway operation');
  }
  return queryResult;
};

const analyticsQueryGatewayMakeQueryRequest = async (
  api: AnalyticsQueryGatewayAPIApi,
  request: V1MetricsResourceResourceTypeIdResourceIdPostRequest,
): Promise<AnalyticsQueryGatewayAPIOperation> => {
  const { operation } = await api.v1MetricsResourceResourceTypeIdResourceIdPost(request);

  if (!operation) {
    throw new Error('Error: no operation in analytics-query-gateway query response');
  }
  return operation;
};

const clientToApiBreakdown = (
  given?: readonly RAQIV2Dimension[],
): AnalyticsQueryGatewayAPIQueryBreakdown[] | undefined => {
  if (!given) return given;
  return given.map((dim) => ({ dimensions: [dim] }));
};

const clientToApiFilter = (
  given?: readonly QueryFilter[],
): AnalyticsQueryGatewayAPIQueryFilter[] | undefined => {
  if (!given) return given;
  return [...given];
};

const analyticsQueryGatewayGetDimensionResponseToResult = ({
  dimensionValuesResult,
}: AnalyticsQueryGatewayAPIOperation) => {
  if (!dimensionValuesResult) {
    throw new Error('Error: no dimension values result in analytics-query-gateway operation');
  }
  return dimensionValuesResult;
};

const analyticsQueryGatewayMakeGetDimensionValuesRequest = async (
  api: AnalyticsQueryGatewayAPIApi,
  request: V1DimensionsResourceResourceTypeIdResourceIdPostRequest,
): Promise<AnalyticsQueryGatewayAPIOperation> => {
  const { operation } = await api.v1DimensionsResourceResourceTypeIdResourceIdPost(request);

  if (!operation) {
    throw new Error('Error: no operation in analytics-query-gateway dimension response');
  }
  return operation;
};

const analyticsQueryGatewayGetMetricMetadataResponseToResult = ({
  metricMetadataResult,
}: AnalyticsQueryGatewayAPIOperation) => {
  if (!metricMetadataResult) {
    throw new Error('Error: no dimension values result in analytics-query-gateway operation');
  }
  return metricMetadataResult;
};

const analyticsQueryGatewayMakeGetMetricMetadataRequest = async (
  api: AnalyticsQueryGatewayAPIApi,
  request: V1MetricsMetadataPostRequest,
): Promise<AnalyticsQueryGatewayAPIOperation> => {
  const { operation } = await api.v1MetricsMetadataPost(request);

  if (!operation) {
    throw new Error('Error: no operation in analytics-query-gateway metric metadata response');
  }
  return operation;
};

const analyticsQueryGatewayMakeExecuteDagRequest = async (
  api: AnalyticsQueryGatewayAPIApi,
  request: V1DagExecutePostRequest,
): Promise<AnalyticsQueryGatewayExecuteDagResult> => {
  return api.v1DagExecutePost(request);
};

const analyticsQueryGatewayMakeValidateDagRequest = async (
  api: AnalyticsQueryGatewayAPIApi,
  request: V1DagValidatePostRequest,
): Promise<AnalyticsQueryGatewayValidateDagResult> => {
  return api.v1DagValidatePost(request);
};

export const makeAnalyticsQueryGatewayClient = (
  options: RAQIClientOptions,
  api: AnalyticsQueryGatewayAPIApi = analyticsQueryGatewayApi,
): AnalyticsQueryGatewayClientWrapper => {
  const query = async (
    queryRequest: AnalyticsQueryGatewayAPIQueryRequest,
  ): Promise<AnalyticsQueryGatewayAPIQueryResult> => {
    const resourceFields = {
      resourceType: mapChartResourceTypeToTargetResourceType(
        queryRequest.resource.type,
        AnalyticsQueryGatewayAPIResourceType,
      ),
      resourceId: queryRequest.resource.id.toString(),
    };
    const request: V1MetricsResourceResourceTypeIdResourceIdPostRequest = {
      ...resourceFields,
      queryRequest: {
        ...resourceFields,
        query: {
          metric: queryRequest.metric,
          startTime: queryRequest.startTime.toISOString(),
          endTime: queryRequest.endTime.toISOString(),
          granularity: queryRequest.granularity,
          breakdown: clientToApiBreakdown(queryRequest.breakdown),
          filter: clientToApiFilter(queryRequest.filter),
          limit: queryRequest.limit,
        },
      },
    };

    return poll(
      () => analyticsQueryGatewayMakeQueryRequest(api, request),
      options,
      analyticsQueryGatewayOperationResponseToResult,
    );
  };

  const getDimensionValues = async (request: AnalyticsQueryGatewayGetDimensionValuesRequest) => {
    const resourceFields = {
      resourceType: mapChartResourceTypeToTargetResourceType(
        request.resource.type,
        AnalyticsQueryGatewayAPIResourceType,
      ),
      resourceId: request.resource.id.toString(),
    };
    const dimensionValuesRequest: V1DimensionsResourceResourceTypeIdResourceIdPostRequest = {
      ...resourceFields,
      dimensionValuesRequest: {
        ...resourceFields,
        query: {
          ...resourceFields,
          dimensions: getNamespacedDimensionsForMetrics(request.dimension, request.metrics),
          startTime: request.startTime.toISOString(),
          endTime: request.endTime.toISOString(),
          filters: clientToApiFilter(request.filter),
          granularity: request.granularity,
        },
      },
    };

    return poll(
      () => analyticsQueryGatewayMakeGetDimensionValuesRequest(api, dimensionValuesRequest),
      options,
      analyticsQueryGatewayGetDimensionResponseToResult,
    );
  };

  const getMetricMetadata = async (request: AnalyticsQueryGatewayGetMetricMetadataRequest) => {
    const metricMetadataRequest: V1MetricsMetadataPostRequest = {
      metricMetadataRequest: {
        query: {
          metrics: request.metrics,
        },
      },
    };
    return poll(
      () => analyticsQueryGatewayMakeGetMetricMetadataRequest(api, metricMetadataRequest),
      options,
      analyticsQueryGatewayGetMetricMetadataResponseToResult,
    );
  };

  const getStatusConfig = async (request: AnalyticsQueryGatewayGetStatusConfigRequest) => {
    return api.v1StatusConfigGet({ universeId: request.universeId });
  };

  const executeDag = async (
    request: AnalyticsQueryGatewayExecuteDagRequest,
  ): Promise<AnalyticsQueryGatewayExecuteDagResult> => {
    return analyticsQueryGatewayMakeExecuteDagRequest(api, {
      executeDagRequest: request,
    });
  };

  const validateDag = async (
    request: AnalyticsQueryGatewayValidateDagRequest,
  ): Promise<AnalyticsQueryGatewayValidateDagResult> => {
    return analyticsQueryGatewayMakeValidateDagRequest(api, {
      validateDagRequest: request,
    });
  };

  return { query, getDimensionValues, getMetricMetadata, getStatusConfig, executeDag, validateDag };
};
