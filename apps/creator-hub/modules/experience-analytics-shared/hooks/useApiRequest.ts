import { useState, useEffect, useCallback, useRef } from 'react';
import { captureException } from '@sentry/nextjs';
import type { GenericChartState } from '@modules/charts-generic/charts/types/ChartTypes';
import logAnalyticsError from '@modules/charts-generic/utils/logAnalyticsError';
import { isRAQIQueryError } from '@modules/clients/analytics';
import { getResponseFromError } from '@modules/clients/utils';
import { HttpStatusCodes } from '@modules/miscellaneous/common';
import { isAceDagExecutionError } from '../utils/AceDagExecutionError';
import { isRAQIV2LoadingException } from '../utils/RAQIV2InternalException';
import { RAQIV2ValidationError } from '../utils/validateRAQIV2Request';

type TMakeRequest<ResponseType> = () => Promise<ResponseType>;

export type TUseApiRequestOptions = {
  enabled?: boolean;
  /**
   * When true, a new `makeRequest` identity reports loading immediately (including
   * via `refresh()`). `makeRequest` must be referentially stable across renders —
   * a fresh closure every render would pin `isDataLoading` to true because
   * `completedMakeRequest` can never catch up.
   */
  refetchShouldSetLoading?: boolean;
  invalidateCache?: () => void;
  trackRequestVersion?: boolean;
};

export type TUseApiRequestResponse<ResponseType> = GenericChartState & {
  data: ResponseType | null;
  refresh: () => void;
  requestIdentity?: TMakeRequest<ResponseType>;
  requestVersion?: number;
};

enum RequestAbortedReason {
  NewRequestMade = 'NewRequestMade',
  ComponentUnmounted = 'ComponentUnmounted',
}

const forbiddenStatusCode: number = HttpStatusCodes.FORBIDDEN;

/**
 * Match `FetchError` by `name`, not `instanceof`: generated clients re-export
 * that class from possibly duplicate `@rbx/clients-core` copies (`getResponseFromError`).
 */
const isFetchError = (error: unknown): boolean =>
  error instanceof Error && error.name === 'FetchError';

const callRequest = <ResponseType>(
  makeRequest: TMakeRequest<ResponseType>,
): Promise<ResponseType> => {
  try {
    return makeRequest();
  } catch (requestError) {
    return Promise.reject(requestError);
  }
};

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
  const [data, setData] = useState<ResponseType | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [completedMakeRequest, setCompletedMakeRequest] = useState<TMakeRequest<ResponseType>>(
    () => makeRequest,
  );
  const abortControllerRef = useRef<AbortController>(new AbortController());
  const hasStartedRequest = useRef(false);
  // NOTE: the attempt counter is a ref rather than state on purpose. A state bump per attempt
  // would re-render, and a caller that rebuilds `makeRequest` each render would then re-fire
  // the request effect and loop. Attempts still land alongside a real state change
  // (loading/data/error), so consumers observe each bump without a dedicated render.
  const requestVersionRef = useRef(0);

  const {
    enabled = true,
    refetchShouldSetLoading = false,
    invalidateCache,
    trackRequestVersion = false,
  } = options ?? {};
  const makeRequestAndUpdateState = useCallback(() => {
    if (trackRequestVersion && hasStartedRequest.current) {
      requestVersionRef.current += 1;
    } else {
      hasStartedRequest.current = true;
    }

    // abort in-flight request when a new request is made
    abortControllerRef.current.abort(RequestAbortedReason.NewRequestMade);
    const abortControllerForCurrentRequest = new AbortController();
    abortControllerRef.current = abortControllerForCurrentRequest;

    const requestPromise = callRequest(makeRequest);

    const updateStateFromRequest = async () => {
      try {
        const response = await requestPromise;
        if (abortControllerForCurrentRequest.signal.aborted) {
          return;
        }

        setData(response);
        setResponseFailure(false);
        setUserForbidden(false);
        setDataLoading(false);
        setError(null);
        if (refetchShouldSetLoading) {
          setCompletedMakeRequest(() => makeRequest);
        }
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
        if (refetchShouldSetLoading) {
          setCompletedMakeRequest(() => makeRequest);
        }
        if (e instanceof Error) {
          setError(e);
        }

        const resErr = getResponseFromError(e);
        if (resErr) {
          const errorCode = resErr?.status ?? 500;
          setUserForbidden(errorCode === forbiddenStatusCode);
        } else if (e instanceof RAQIV2ValidationError) {
          // NOTE(gperkins@20251202): This happens when a request is invalid
          // (e.g. unsupported filter/breakdown dimension or granularity)
          // This is somewhat commonplace in e.g. custom dashboards,
          // where metrics with different supported dimensions are used on a single page.
          // UI-facing message is picked by genericChartStateToChartAbnormalState.
          //
          // TODO(gperkins@20251202): DSA-5144: Handle the various errors more specifically in the UI
        } else if (isRAQIQueryError(e)) {
          // UI-facing message is picked by genericChartStateToChartAbnormalState;
          // we only log to Sentry here. Tags stay bounded-cardinality (safe to
          // aggregate); identifiers go on `extra`.
          //
          // `raqiValidationField` is the bounded classifier for validation
          // failures: its values are exactly the members of
          // `RAQIQueryValidationField` (handful of short strings) plus `'none'`
          // when the backend didn't attribute the failure to a specific field.
          // This replaces a prior per-case boolean tag; new validation variants
          // get coverage for free when the proto enum grows.
          captureException(e, {
            tags: {
              module: 'analytics',
              errorType: 'RAQIQueryError',
              raqiQueryErrorCode: e.code,
              raqiQueryErrorCodeKnown: e.isKnownCode,
              raqiValidationField: e.validationDetails?.field ?? 'none',
            },
            extra: {
              operationPath: e.operationPath,
              backendMessage: e.message,
              validationDetails: e.validationDetails,
            },
          });
        } else if (isAceDagExecutionError(e)) {
          // Known ACE DAG execution failure (computed metric, variant fanout,
          // TopN / rank, L7 smoothing, or the generic base for callers that
          // don't specialize). The chart abnormal-state mapper renders
          // ACE-specific copy; Sentry gets structured fields for triage. Tags
          // stay bounded-cardinality (safe to aggregate); identifiers go on
          // `extra`. `errorType` uses the concrete subclass name so the ACE
          // failure kinds stay distinguishable in Sentry.
          captureException(e, {
            tags: {
              module: 'analytics',
              errorType: e.name,
              aceErrorCode: e.code ?? 'none',
              aceErrorSeverity: e.severity ?? 'none',
            },
            extra: {
              operationId: e.operationId,
              nodeId: e.nodeId,
              suggestion: e.suggestion,
              backendMessage: e.message,
            },
          });
        } else if (isFetchError(e)) {
          // Network error - already logged by SentryMiddleware.onError
          // (It may have been ignored due to the ignoreErrors list in init.ts)
          // We already set the error state and there is no additional logging needed
        } else {
          // This is some remaining unknown issue and we probably want to hear about it
          logAnalyticsError('Unknown useApiRequest Error:', e);
        }
      }
    };
    void updateStateFromRequest();
  }, [makeRequest, refetchShouldSetLoading, trackRequestVersion]);

  useEffect(() => {
    if (enabled) {
      makeRequestAndUpdateState();
    }
  }, [enabled, makeRequestAndUpdateState]);

  useEffect(() => {
    return () => {
      const abortController = abortControllerRef.current;
      if (!abortController.signal.aborted) {
        abortController.abort(RequestAbortedReason.ComponentUnmounted);
      }
    };
  }, []);

  const refresh = useCallback(() => {
    if (!enabled) {
      return;
    }
    if (invalidateCache) {
      invalidateCache();
    }
    if (refetchShouldSetLoading) {
      setDataLoading(true);
    }
    makeRequestAndUpdateState();
  }, [enabled, makeRequestAndUpdateState, invalidateCache, refetchShouldSetLoading]);

  // oxlint-disable react/react-compiler -- see requestVersionRef above; a ref-backed counter is
  // what keeps an attempt from scheduling a render and re-firing the request effect.
  const requestVersion = requestVersionRef.current;

  return {
    isDataLoading:
      enabled && refetchShouldSetLoading && completedMakeRequest !== makeRequest
        ? true
        : isDataLoading,
    isResponseFailed,
    isUserForbidden,
    data,
    refresh,
    error,
    requestIdentity: makeRequest,
    requestVersion,
  };
};

export default useApiRequest;
