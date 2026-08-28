import { useCallback, useMemo, useRef } from 'react';
import type { ClientCacheStatus } from '../context/AnalyticsQueryGatewayProvider';
import { useRAQIV2Client } from '../context/RAQIV2ClientProvider';
import type { RAQIV2UIQueryRequest } from '../types/RAQIV2UIQueryRequest';
import type { RAQIV2QueryResponses } from '../utils/combineRAQIV2QueryResponses';
import isComparisonWithinRetention from '../utils/isComparisonWithinRetention';
import type { MakeRAQIV2RequestOptions } from '../utils/makeRAQIV2Request';
import makeRAQIV2Request from '../utils/makeRAQIV2Request';
import { maybeThrowRAQIV2InternalException } from '../utils/RAQIV2InternalException';
import stripFetchComparisonForBreakdown from '../utils/stripFetchComparisonForBreakdown';
import { validateRAQIV2Request } from '../utils/validateRAQIV2Request';
import type { TUseApiRequestResponse } from './useApiRequest';
import useApiRequest from './useApiRequest';

// NOTE(shumingxu, 02/22/2024): This is the ideal entry point for RAQI V2 requests as this handles
// processing utils and cache handling for consumers.
const useRAQIV2Request = (
  request: RAQIV2UIQueryRequest,
  makeRAQIV2RequestOptions?: MakeRAQIV2RequestOptions,
  ignoreCache?: boolean,
  shouldFetch = true,
): TUseApiRequestResponse<RAQIV2QueryResponses> & {
  getClientCacheStatus: () => ClientCacheStatus | undefined;
  requestIdentity?: object;
  requestVersion?: number;
  resolvedOptions?: MakeRAQIV2RequestOptions;
} => {
  const { clearCache, createClientCacheTracking } = useRAQIV2Client(ignoreCache ?? false);
  const clientCacheStatus = useRef<ClientCacheStatus | undefined>(undefined);

  const resolvedOptions = useMemo((): MakeRAQIV2RequestOptions => {
    const callerOptions = stripFetchComparisonForBreakdown(request, makeRAQIV2RequestOptions) ?? {};
    const effectiveOptions: MakeRAQIV2RequestOptions = {
      ...callerOptions,
      enableAceVariantFanout: makeRAQIV2RequestOptions?.enableAceVariantFanout ?? true,
    };

    if (!effectiveOptions.fetchComparison) {
      return effectiveOptions;
    }

    const withinRetention = isComparisonWithinRetention(
      request.metric,
      request.timeSpec,
      effectiveOptions.fetchComparison,
    );

    if (withinRetention) {
      return effectiveOptions;
    }

    return {
      ...effectiveOptions,
      fetchComparison: undefined,
    };
  }, [makeRAQIV2RequestOptions, request]);

  const makeRaqiRequest = useCallback(async () => {
    clientCacheStatus.current = undefined;
    const cacheTracking = createClientCacheTracking();
    const validationError = validateRAQIV2Request(request);
    if (validationError.length > 0) {
      throw validationError[0];
    }
    maybeThrowRAQIV2InternalException(request.resource, 'useRAQIV2Request');
    try {
      const result = await makeRAQIV2Request(request, cacheTracking.client, resolvedOptions);
      clientCacheStatus.current = cacheTracking.getClientCacheStatus();
      return result;
    } catch (error) {
      clientCacheStatus.current = cacheTracking.getClientCacheStatus();
      throw error;
    }
  }, [createClientCacheTracking, resolvedOptions, request]);

  const response = useApiRequest(makeRaqiRequest, {
    enabled: shouldFetch,
    refetchShouldSetLoading: true,
    invalidateCache: ignoreCache ? clearCache : undefined,
    trackRequestVersion: true,
  });
  const getClientCacheStatus = useCallback(() => clientCacheStatus.current, []);

  return {
    ...response,
    getClientCacheStatus,
    requestIdentity: makeRaqiRequest,
    resolvedOptions,
  };
};

export default useRAQIV2Request;
