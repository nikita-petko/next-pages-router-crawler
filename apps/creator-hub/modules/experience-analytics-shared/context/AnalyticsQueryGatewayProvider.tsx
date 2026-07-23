import { useQueryClient } from '@tanstack/react-query';
import type { FC } from 'react';
import React, { useCallback, useMemo } from 'react';
import type { AnalyticsQueryGatewayAPIApi } from '@rbx/client-analytics-query-gateway/v1';
import { RAQIV2WithPollingDefaults } from '@modules/clients/analytics';
import type {
  AnalyticsQueryGatewayAPIQueryRequest,
  AnalyticsQueryGatewayClientWrapper,
  AnalyticsQueryGatewayExecuteDagRequest,
  AnalyticsQueryGatewayGetDimensionValuesRequest,
  AnalyticsQueryGatewayGetMetricMetadataRequest,
  AnalyticsQueryGatewayGetStatusConfigRequest,
  AnalyticsQueryGatewayValidateDagRequest,
} from '@modules/clients/analytics/analyticsQueryGateway';
import { makeAnalyticsQueryGatewayClient } from '@modules/clients/analytics/analyticsQueryGateway';

export const AnalyticsQueryGatewayContext = React.createContext<{
  uncached: AnalyticsQueryGatewayClientWrapper;
  cached: AnalyticsQueryGatewayClientWrapper;
  clearCache: () => void;
} | null>(null);

export const useCachedAnalyticsQueryGateway = () => {
  const context = React.useContext(AnalyticsQueryGatewayContext);
  if (!context) {
    throw new Error(
      'useCachedAnalyticsQueryGateway must be used within a CachedAnalyticsQueryGatewayProvider',
    );
  }
  const { cached: client, clearCache } = context;
  return useMemo(() => ({ client, clearCache }), [client, clearCache]);
};

export const useUncachedAnalyticsQueryGateway = () => {
  const context = React.useContext(AnalyticsQueryGatewayContext);
  if (!context) {
    throw new Error(
      'useUncachedAnalyticsQueryGateway must be used within a CachedAnalyticsQueryGatewayProvider',
    );
  }
  const { uncached } = context;
  return uncached;
};

const getQueryKey = (request: AnalyticsQueryGatewayAPIQueryRequest) => {
  const {
    resource: unstableResource,
    metric,
    startTime,
    endTime,
    granularity,
    breakdown: unstableBreakdown,
    filter: unstableFilter,
    limit,
    ...remainder
  } = request;
  /**
   * NOTE(gperkins@20240819): remainder should be of type {}
   * If it is not, add the new field(s) to the array passed to JSON.stringify
   */
  if (Object.keys(remainder).length > 0) {
    throw new Error(
      `Uncached keys in analytics-query-gateway request: ${Object.keys(remainder).join(', ')}`,
    );
  }
  return JSON.stringify([
    [unstableResource.type, unstableResource.id],
    metric,
    startTime,
    endTime,
    granularity,
    [...(unstableBreakdown ?? [])].sort(),
    [...(unstableFilter ?? [])].sort().map((filter) => ({
      ...filter,
      values: [...filter.values].sort(),
    })),
    limit,
  ]);
};

const getDimensionValuesQueryKey = (request: AnalyticsQueryGatewayGetDimensionValuesRequest) => {
  const { resource, dimension, startTime, endTime, metrics, filter, granularity, ...remainder } =
    request;
  if (Object.keys(remainder).length > 0) {
    throw new Error(
      `Uncached keys in analytics-query-gateway dimension request: ${Object.keys(remainder).join(', ')}`,
    );
  }
  return JSON.stringify([
    resource.type,
    resource.id,
    dimension,
    startTime,
    endTime,
    filter,
    granularity,
    metrics.sort(),
  ]);
};

const getMetricMetadataQueryKey = (request: AnalyticsQueryGatewayGetMetricMetadataRequest) => {
  const { metrics } = request;
  return JSON.stringify(metrics.sort());
};

const noStale = { staleTime: Infinity };
const AnalyticsQueryGatewayProvider: FC<
  React.PropsWithChildren<{ api?: AnalyticsQueryGatewayAPIApi }>
> = ({ children, api }) => {
  // NOTE(gperkins@20240822): Memoize here instead of using module-level symbol,
  // so that tests can mock the makeAnalyticsQueryGatewayClient function.
  const uncached = useMemo(
    () => makeAnalyticsQueryGatewayClient(RAQIV2WithPollingDefaults, api),
    [api],
  );

  const tanstackCache = useQueryClient();
  const cached: AnalyticsQueryGatewayClientWrapper = useMemo(() => {
    const query = async (queryRequest: AnalyticsQueryGatewayAPIQueryRequest) => {
      const queryKey = ['analytics-query-gateway', 'query', getQueryKey(queryRequest)];
      const makeRequest = () => uncached.query(queryRequest);
      return tanstackCache.fetchQuery({ queryKey, queryFn: makeRequest, ...noStale });
    };
    const getDimensionValues = async (request: AnalyticsQueryGatewayGetDimensionValuesRequest) => {
      const queryKey = [
        'analytics-query-gateway',
        'getDimension',
        getDimensionValuesQueryKey(request),
      ];
      const makeRequest = () => uncached.getDimensionValues(request);
      return tanstackCache.fetchQuery({
        queryKey,
        queryFn: makeRequest,
        ...noStale,
      });
    };
    const getMetricMetadata = async (request: AnalyticsQueryGatewayGetMetricMetadataRequest) => {
      const queryKey = [
        'analytics-query-gateway',
        'getMetricMetadata',
        getMetricMetadataQueryKey(request),
      ];
      const makeRequest = () => uncached.getMetricMetadata(request);
      return tanstackCache.fetchQuery({ queryKey, queryFn: makeRequest, ...noStale });
    };
    const getStatusConfig = async (request: AnalyticsQueryGatewayGetStatusConfigRequest) => {
      const queryKey = ['analytics-query-gateway', 'getStatusConfig', request.universeId];
      const makeRequest = () => uncached.getStatusConfig(request);
      return tanstackCache.fetchQuery({ queryKey, queryFn: makeRequest, ...noStale });
    };
    const executeDag = async (request: AnalyticsQueryGatewayExecuteDagRequest) => {
      return uncached.executeDag(request);
    };
    const validateDag = async (request: AnalyticsQueryGatewayValidateDagRequest) => {
      return uncached.validateDag(request);
    };
    return {
      query,
      getDimensionValues,
      getMetricMetadata,
      getStatusConfig,
      executeDag,
      validateDag,
    };
  }, [tanstackCache, uncached]);

  const clearCache = useCallback(() => {
    /**
     * NOTE(gperkins@20240819): We clear all of the values from the cache
     * for the analytics-query-gateway key. This causes everything to hard reset
     * into loading state and refetch.
     *
     * If we used invalidateQueries we would keep the existing data until
     * it has been successfully refetched. But this would mean we would show
     * stale data instead of the loading spinner, which would feel unresponsive
     * unless we introduce a "reloading" state for when there is stale data that
     * is currently being refetched. Of course, a that point we would presumably
     * also want to invalidate specific queries instead of resetting our whole cache.
     *
     * See also https://stackoverflow.com/a/76089491
     */
    tanstackCache.resetQueries({
      queryKey: ['analytics-query-gateway'],
    });
  }, [tanstackCache]);

  const result = useMemo(() => ({ cached, uncached, clearCache }), [cached, clearCache, uncached]);
  return (
    <AnalyticsQueryGatewayContext.Provider value={result}>
      {children}
    </AnalyticsQueryGatewayContext.Provider>
  );
};
export default AnalyticsQueryGatewayProvider;
