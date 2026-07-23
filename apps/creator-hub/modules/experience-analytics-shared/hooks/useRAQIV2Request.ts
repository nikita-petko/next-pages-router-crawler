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
import useRAQIV2RequestFlags from './useRAQIV2RequestFlags';

// NOTE(shumingxu, 02/22/2024): This is the ideal entry point for RAQI V2 requests as this handles
// processing utils and cache handling for consumers.
const useRAQIV2Request = (
  request: RAQIV2UIQueryRequest,
  makeRAQIV2RequestOptions?: MakeRAQIV2RequestOptions,
  ignoreCache?: boolean,
): TUseApiRequestResponse<RAQIV2QueryResponses> => {
  const { client, clearCache } = useRAQIV2Client(ignoreCache ?? false);
  const {
    ready: requestFlagsReady,
    enableAceVariantFanout,
    enableComparisonRangePolicy,
  } = useRAQIV2RequestFlags();

  const resolvedOptions = useMemo((): MakeRAQIV2RequestOptions | undefined => {
    const effectiveOptions = {
      ...stripFetchComparisonForBreakdown(request, makeRAQIV2RequestOptions),
      enableAceVariantFanout,
      enableComparisonRangePolicy,
    };

    if (!effectiveOptions?.fetchComparison) {
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
  }, [enableAceVariantFanout, enableComparisonRangePolicy, makeRAQIV2RequestOptions, request]);

  const makeRaqiRequest = useCallback(() => {
    const validationError = validateRAQIV2Request(request);
    if (validationError.length > 0) {
      throw validationError[0];
    }
    maybeThrowRAQIV2InternalException(request.resource, 'useRAQIV2Request');
    return makeRAQIV2Request(request, client, resolvedOptions);
  }, [client, resolvedOptions, request]);

  const response = useApiRequest(makeRaqiRequest, {
    enabled: requestFlagsReady,
    refetchShouldSetLoading: true,
    invalidateCache: ignoreCache ? clearCache : undefined,
  });

  return response;
};

export default useRAQIV2Request;
