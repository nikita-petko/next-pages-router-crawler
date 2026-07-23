import type { RAQIClientOptions } from '@rbx/analytics-query-gateway-helpers';
import { pollAnalyticsOperation } from '@rbx/analytics-query-gateway-helpers';
import type {
  ExecuteDagRequest as AnalyticsQueryGatewayAPIExecuteDagRequest,
  ExecuteDagResponse as AnalyticsQueryGatewayAPIExecuteDagResponse,
  QueryResult as AnalyticsQueryGatewayAPIQueryResult,
  QueryBreakdown as AnalyticsQueryGatewayAPIQueryBreakdown,
  QueryFilter as AnalyticsQueryGatewayAPIQueryFilter,
  Operation as AnalyticsQueryGatewayAPIOperation,
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
  BannerConfiguration,
  AnnotationConfiguration,
  ChartWarningConfiguration,
  StatusConfigResponse,
  ValidateDagRequest as AnalyticsQueryGatewayAPIValidateDagRequest,
  ValidateDagResponse as AnalyticsQueryGatewayAPIValidateDagResponse,
} from '@rbx/client-analytics-query-gateway/v1';
import {
  AnalyticsQueryGatewayAPIApi,
  ResourceType as AnalyticsQueryGatewayAPIResourceType,
  FilterOperation as AnalyticsQueryGatewayAPIFilterOperation,
  DataStatus as AnalyticsDataStatus,
} from '@rbx/client-analytics-query-gateway/v1';
import type { RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import type { RAQIV2Dimension, TRAQIV2APIMetric } from '@rbx/creator-hub-analytics-config';
import { createClientConfiguration } from '../utils/createClientConfiguration';
import type {
  ChartResource,
  QueryFilter,
  RAQIV2CombinedAPIQueryRequestBase,
} from './analyticsRAQIShared';
import { mapChartResourceTypeToTargetResourceType } from './analyticsRAQIShared';
import getNamespacedDimensionsForMetrics from './getNamespacedDimensionsForMetrics';
import sanitizeDagRequest from './sanitizeDagRequest';
import { sanitizeFilterListForBackend } from './sanitizeFilterValuesForBackend';

const configuration = createClientConfiguration('analytics-query-gateway', 'bedev2');

const analyticsQueryGatewayApi = new AnalyticsQueryGatewayAPIApi(configuration);

export type AnalyticsQueryGatewayAPIQueryRequest = RAQIV2CombinedAPIQueryRequestBase & {
  resource: ChartResource;
};

export type {
  OperationMetadata as AnalyticsQueryGatewayAPIOperationMetadata,
  QueryError as AnalyticsQueryGatewayAPIQueryError,
} from '@rbx/client-analytics-query-gateway/v1';
export type {
  AnalyticsQueryGatewayAPIDataPoint,
  AnalyticsQueryGatewayAPIBreakdownValue,
  AnalyticsQueryGatewayAPIMetricValue,
  AnalyticsQueryGatewayAPIQueryResult,
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
  if (!given) {
    return given;
  }
  return given.map((dim) => ({ dimensions: [dim] }));
};

// Wrapper kept for type narrowing (`QueryFilter` -> the gateway's own filter
// type) and for the in-file readability of "client -> api" at the request
// construction sites below. The actual sanitization logic — stripping RAQI
// reserved sentinel values that the druid backend rejects with a 500 — lives
// in `sanitizeFilterValuesForBackend.ts` so it can be unit-tested without
// pulling the gateway's transitive deps into the test runtime.
const clientToApiFilter = (
  given?: readonly QueryFilter[],
): AnalyticsQueryGatewayAPIQueryFilter[] | undefined => sanitizeFilterListForBackend(given);

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

    return pollAnalyticsOperation(
      () => analyticsQueryGatewayMakeQueryRequest(api, request),
      analyticsQueryGatewayOperationResponseToResult,
      options,
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

    return pollAnalyticsOperation(
      () => analyticsQueryGatewayMakeGetDimensionValuesRequest(api, dimensionValuesRequest),
      analyticsQueryGatewayGetDimensionResponseToResult,
      options,
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
    return pollAnalyticsOperation(
      () => analyticsQueryGatewayMakeGetMetricMetadataRequest(api, metricMetadataRequest),
      analyticsQueryGatewayGetMetricMetadataResponseToResult,
      options,
    );
  };

  const getStatusConfig = async (request: AnalyticsQueryGatewayGetStatusConfigRequest) => {
    return api.v1StatusConfigGet({ universeId: request.universeId });
  };

  const executeDag = async (
    request: AnalyticsQueryGatewayExecuteDagRequest,
  ): Promise<AnalyticsQueryGatewayExecuteDagResult> => {
    return analyticsQueryGatewayMakeExecuteDagRequest(api, {
      executeDagRequest: sanitizeDagRequest(request),
    });
  };

  const validateDag = async (
    request: AnalyticsQueryGatewayValidateDagRequest,
  ): Promise<AnalyticsQueryGatewayValidateDagResult> => {
    return analyticsQueryGatewayMakeValidateDagRequest(api, {
      validateDagRequest: sanitizeDagRequest(request),
    });
  };

  return { query, getDimensionValues, getMetricMetadata, getStatusConfig, executeDag, validateDag };
};
