import { GenericChartState, logAnalyticsError } from '@modules/charts-generic';
import { NoDataAvailableError } from '@modules/clients/analytics';
import { getResponseFromError } from '@modules/clients/utils';
import { HttpStatusCodes } from '@modules/miscellaneous/common';

import { useState, useEffect, useCallback, useRef } from 'react';
import { FetchError } from '@rbx/clients';
import { isRAQIV2LoadingException } from '../utils/RAQIV2InternalException';
import { RAQIV2ValidationError } from '../utils/validateRAQIV2Request';

type TMakeRequest<ResponseType> = () => Promise<ResponseType>;

export type TUseApiRequestOptions = {
  refetchShouldSetLoading?: boolean;
  invalidateCache?: () => void;
};

export type TUseApiRequestResponse<ResponseType> = GenericChartState & {
  data: ResponseType | null;
  refresh: () => void;
};

enum RequestAbortedReason {
  NewRequestMade = 'NewRequestMade',
  ComponentUnmounted = 'ComponentUnmounted',
}

// NOTE(shumingxu, 09/29/2023): This pattern is repeated a lot in the current code
// but will try to slowly migrate towards this wrapper.
// Wrapper for making async requests with standard states and update hooks
const useApiRequest = <ResponseType>(
  makeRequest: TMakeRequest<ResponseType>,
  options?: TUseApiRequestOptions,
): TUseApiRequestResponse<ResponseType> => {
  const [isDataLoading, setDataLoading] = useState<boolean>(true);
  const [isResponseFailed, setResponseFailure] = useState<boolean>(false);
  const [isUserForbidden, setUserForbidden] = useState<boolean>(false);
  const [isNoDataAvailable, setIsNoDataAvailable] = useState<boolean>(false);
  const [data, setData] = useState<ResponseType | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController>(new AbortController());

  const { refetchShouldSetLoading = false, invalidateCache = undefined } = options ?? {};
  const makeRequestAndUpdateState = useCallback(async () => {
    // abort in-flight request when a new request is made
    abortControllerRef.current.abort(RequestAbortedReason.NewRequestMade);
    const abortControllerForCurrentRequest = new AbortController();
    abortControllerRef.current = abortControllerForCurrentRequest;

    try {
      if (refetchShouldSetLoading) {
        setDataLoading(true);
      }

      const response = await makeRequest();
      if (abortControllerForCurrentRequest.signal.aborted) {
        return;
      }

      setData(response);
      setResponseFailure(false);
      setUserForbidden(false);
      setIsNoDataAvailable(false);
      setDataLoading(false);
      setError(null);
    } catch (e) {
      if (abortControllerForCurrentRequest.signal.aborted) {
        // request was aborted, do nothing
        return;
      }

      if (isRAQIV2LoadingException(e)) {
        // not a failure, actually still loading...
        return;
      }

      setResponseFailure(true);
      setDataLoading(false);
      if (e instanceof Error) {
        setError(e);
      }

      const resErr = getResponseFromError(e);
      if (resErr) {
        const errorCode = resErr?.status ?? 500;
        setUserForbidden(errorCode === HttpStatusCodes.FORBIDDEN);
      } else if (e instanceof NoDataAvailableError) {
        // TODO(shumingxu, 05/19/2025): DSA-4491: Remove in favor of passing down error
        setIsNoDataAvailable(true);
      } else if (e instanceof RAQIV2ValidationError) {
        // NOTE(gperkins@20251202): This happens when a request is invalid
        // (e.g. unsupported filter/breakdown dimension or granularity)
        // This is somewhat commonplace in e.g. custom dashboards,
        // where metrics with different supported dimensions are used on a single page.
        // Currently we just show "No data for selected filter".
        //
        // TODO(gperkins@20251202): DSA-5144: Handle the various errors more specifically in the UI
        setIsNoDataAvailable(true);
      } else if (e instanceof FetchError) {
        // Network error - already logged by SentryMiddleware.onError
        // (It may have been ignored due to the ignoreErrors list in init.ts)
        // We already set the error state and there is no additional logging needed
      } else {
        // This is some remaining unknown issue and we probably want to hear about it
        logAnalyticsError('Unknown useApiRequest Error:', e);
      }
    }
  }, [makeRequest, refetchShouldSetLoading]);

  useEffect(() => {
    makeRequestAndUpdateState();
  }, [makeRequestAndUpdateState]);

  useEffect(() => {
    return () => {
      const abortController = abortControllerRef.current;
      if (!abortController.signal.aborted) {
        abortController.abort(RequestAbortedReason.ComponentUnmounted);
      }
    };
  }, []);

  const refresh = useCallback(() => {
    if (invalidateCache) {
      invalidateCache();
    }
    makeRequestAndUpdateState();
  }, [makeRequestAndUpdateState, invalidateCache]);

  return {
    isDataLoading,
    isResponseFailed,
    isUserForbidden,
    isNoDataAvailable,
    data,
    refresh,
    error,
  };
};

export default useApiRequest;
