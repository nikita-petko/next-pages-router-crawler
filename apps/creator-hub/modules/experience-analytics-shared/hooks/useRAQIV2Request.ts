import { useCallback, useMemo } from 'react';
import { FeatureFlagNamespace } from '@modules/feature-flags/namespaces';
import { useFeatureFlagsForNamespace } from '@modules/feature-flags/context/FeatureFlagsProvider';
import { RAQIV2UIQueryRequest } from '../types/RAQIV2UIQueryRequest';
import { RAQIV2QueryResponses } from '../utils/combineRAQIV2QueryResponses';
import { useRAQIV2Client } from '../context/RAQIV2ClientProvider';
import makeRAQIV2Request, { MakeRAQIV2RequestOptions } from '../utils/makeRAQIV2Request';
import useApiRequest, { TUseApiRequestResponse } from './useApiRequest';
import { maybeThrowRAQIV2InternalException } from '../utils/RAQIV2InternalException';
import validateRAQIV2Request from '../utils/validateRAQIV2Request';
import useAllowComputedMetrics from './useAllowComputedMetrics';
import isComparisonWithinRetention from '../utils/isComparisonWithinRetention';

// NOTE(shumingxu, 02/22/2024): This is the ideal entry point for RAQI V2 requests as this handles
// processing utils and cache handling for consumers.
const useRAQIV2Request = (
  request: RAQIV2UIQueryRequest,
  makeRAQIV2RequestOptions?: MakeRAQIV2RequestOptions,
  ignoreCache?: boolean,
): TUseApiRequestResponse<RAQIV2QueryResponses> => {
  const { client, clearCache } = useRAQIV2Client(ignoreCache ?? false);
  const allowComputedMetricsByFeatureFlag = useAllowComputedMetrics();
  const { isRetentionCheckEnabled } = useFeatureFlagsForNamespace(
    'isRetentionCheckEnabled',
    FeatureFlagNamespace.Analytics,
  );

  const resolvedOptions = useMemo((): MakeRAQIV2RequestOptions | undefined => {
    if (!isRetentionCheckEnabled || !makeRAQIV2RequestOptions?.fetchComparison) {
      return makeRAQIV2RequestOptions;
    }

    const withinRetention = isComparisonWithinRetention(
      request.metric,
      request.timeSpec,
      makeRAQIV2RequestOptions.fetchComparison.seriesIntervalMeaning,
    );

    if (withinRetention) {
      return makeRAQIV2RequestOptions;
    }

    return {
      ...makeRAQIV2RequestOptions,
      fetchComparison: undefined,
    };
  }, [isRetentionCheckEnabled, makeRAQIV2RequestOptions, request.metric, request.timeSpec]);

  const makeRaqiRequest = useCallback(() => {
    const validationError = validateRAQIV2Request(request);
    if (validationError.length > 0) {
      throw validationError[0];
    }
    maybeThrowRAQIV2InternalException(request.resource, 'useRAQIV2Request');
    const allowComputedMetrics =
      resolvedOptions?.allowComputedMetrics ?? allowComputedMetricsByFeatureFlag;
    return makeRAQIV2Request(request, client, {
      ...resolvedOptions,
      allowComputedMetrics,
    });
  }, [allowComputedMetricsByFeatureFlag, client, resolvedOptions, request]);

  const response = useApiRequest(makeRaqiRequest, {
    refetchShouldSetLoading: true,
    invalidateCache: ignoreCache ? clearCache : undefined,
  });

  return response;
};

export default useRAQIV2Request;
