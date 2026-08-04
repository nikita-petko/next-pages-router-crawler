import { useCallback, useMemo } from 'react';
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
): TUseApiRequestResponse<RAQIV2QueryResponses> => {
  const { client, clearCache } = useRAQIV2Client(ignoreCache ?? false);

  const resolvedOptions = useMemo((): MakeRAQIV2RequestOptions => {
    const callerOptions = stripFetchComparisonForBreakdown(request, makeRAQIV2RequestOptions) ?? {};
    const effectiveOptions: MakeRAQIV2RequestOptions = {
      ...callerOptions,
      enableAceVariantFanout: makeRAQIV2RequestOptions?.enableAceVariantFanout ?? true,
      routePrecomputedL7ToAce:
        makeRAQIV2RequestOptions?.routePrecomputedL7ToAce ??
        client.routePrecomputedL7ToAce ??
        false,
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
  }, [makeRAQIV2RequestOptions, request, client.routePrecomputedL7ToAce]);

  const makeRaqiRequest = useCallback(() => {
    const validationError = validateRAQIV2Request(request);
    if (validationError.length > 0) {
      throw validationError[0];
    }
    maybeThrowRAQIV2InternalException(request.resource, 'useRAQIV2Request');
    return makeRAQIV2Request(request, client, resolvedOptions);
  }, [client, resolvedOptions, request]);

  const response = useApiRequest(makeRaqiRequest, {
    refetchShouldSetLoading: true,
    invalidateCache: ignoreCache ? clearCache : undefined,
  });

  return response;
};

export default useRAQIV2Request;
