import { useEffect, useMemo, useRef, useState } from 'react';
import type { GenericChartState } from '@modules/charts-generic/charts/types/ChartTypes';
import { getResponseFromError } from '@modules/clients/utils';
import { HttpStatusCodes } from '@modules/miscellaneous/common';
import { isRAQIV2LoadingException } from '../utils/RAQIV2InternalException';

type MappedApiRequestResponse<IdType, ResponseType> = {
  data: Map<IdType, ResponseType | null>;
  orderedData: (ResponseType | null)[];
  requestIdentity: (ids: IdType[]) => Promise<Map<IdType, ResponseType>>;
  requestVersion: number;
} & GenericChartState;

type MappedApiRequestState<IdType, ResponseType> = {
  makeRequest: (ids: IdType[]) => Promise<Map<IdType, ResponseType>>;
  isDataLoading: boolean;
  isResponseFailed: boolean;
  isUserForbidden: boolean;
  data: Map<IdType, ResponseType | null>;
};

const useMappedApiRequest = <IdType, ResponseType>(
  ids: IdType[],
  makeRequest: (ids: IdType[]) => Promise<Map<IdType, ResponseType>>,
  enabled = true,
  trackRequestVersion = false,
): MappedApiRequestResponse<IdType, ResponseType> => {
  const [requestState, setRequestState] = useState<MappedApiRequestState<IdType, ResponseType>>(
    () => ({
      makeRequest,
      isDataLoading: ids.length > 0,
      isResponseFailed: false,
      isUserForbidden: false,
      data: new Map(),
    }),
  );
  const requestOwnerRef = useRef(makeRequest);
  const resetRequestInFlightRef = useRef(false);
  const nextRequestIdRef = useRef(0);
  const latestRequestIdRef = useRef(0);
  const latestRequestIdByIdRef = useRef(new Map<IdType, number>());
  const pendingRequestIdByIdRef = useRef(new Map<IdType, number>());
  const resetData = useMemo(() => new Map<IdType, ResponseType | null>(), []);
  const ownsRequestState = requestState.makeRequest === makeRequest;
  const data = ownsRequestState ? requestState.data : resetData;
  const hasStartedRequest = useRef(false);
  // NOTE: ref-backed for the same reason as useApiRequest — a state bump per attempt would
  // re-render, re-run this effect for callers that rebuild `makeRequest` each render, and loop.
  const requestVersionRef = useRef(0);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // An owner change with no ids to fetch advances `requestOwnerRef` without issuing a
    // request, leaving `requestState` owned by the previous `makeRequest`. Its data is not
    // visible to consumers, so it must not count as already fetched — otherwise ids that
    // the previous owner had resolved would never be requested from the new one.
    const shouldResetData =
      requestOwnerRef.current !== makeRequest ||
      (!ownsRequestState && pendingRequestIdByIdRef.current.size === 0);
    if (shouldResetData) {
      requestOwnerRef.current = makeRequest;
      resetRequestInFlightRef.current = true;
      latestRequestIdByIdRef.current.clear();
      pendingRequestIdByIdRef.current.clear();
    }
    const newIds = shouldResetData
      ? ids
      : ids.filter(
          (id) =>
            !requestState.data.has(id) &&
            (resetRequestInFlightRef.current || !pendingRequestIdByIdRef.current.has(id)),
        );

    if (newIds.length === 0) {
      return;
    }
    const requestId = nextRequestIdRef.current + 1;
    nextRequestIdRef.current = requestId;
    latestRequestIdRef.current = requestId;
    newIds.forEach((id) => {
      latestRequestIdByIdRef.current.set(id, requestId);
      pendingRequestIdByIdRef.current.set(id, requestId);
    });

    if (trackRequestVersion && hasStartedRequest.current) {
      // oxlint-disable-next-line react/react-compiler -- attempt counter is intentionally ref-backed to avoid a render/refetch loop
      requestVersionRef.current += 1;
    } else {
      hasStartedRequest.current = true;
    }

    const makeRequestAndUpdateState = async () => {
      try {
        const responseMap = await makeRequest(newIds);
        if (requestOwnerRef.current !== makeRequest) {
          return;
        }
        const ownedIds = newIds.filter(
          (id) => latestRequestIdByIdRef.current.get(id) === requestId,
        );
        if (ownedIds.length === 0) {
          return;
        }
        resetRequestInFlightRef.current = false;
        newIds.forEach((id) => {
          if (pendingRequestIdByIdRef.current.get(id) === requestId) {
            pendingRequestIdByIdRef.current.delete(id);
          }
        });
        const ownedResponses = Array.from(responseMap).filter(
          ([id]) => (latestRequestIdByIdRef.current.get(id) ?? 0) <= requestId,
        );
        ownedResponses.forEach(([id]) => latestRequestIdByIdRef.current.set(id, requestId));
        setRequestState((previousState) => {
          const previousData =
            previousState.makeRequest === makeRequest ? Array.from(previousState.data) : [];
          const isLatestRequest = latestRequestIdRef.current === requestId;
          return {
            makeRequest,
            isDataLoading: pendingRequestIdByIdRef.current.size > 0,
            isResponseFailed: isLatestRequest ? false : previousState.isResponseFailed,
            isUserForbidden: isLatestRequest ? false : previousState.isUserForbidden,
            data: new Map([
              ...previousData,
              // fill in ids that did not receive a response with null
              ...ownedIds.map((id) => [id, null] as [IdType, null]),
              ...ownedResponses,
            ]),
          };
        });
      } catch (e) {
        if (requestOwnerRef.current !== makeRequest) {
          return;
        }
        const ownedIds = newIds.filter(
          (id) => latestRequestIdByIdRef.current.get(id) === requestId,
        );
        if (ownedIds.length === 0) {
          return;
        }
        resetRequestInFlightRef.current = false;
        newIds.forEach((id) => {
          if (pendingRequestIdByIdRef.current.get(id) === requestId) {
            pendingRequestIdByIdRef.current.delete(id);
          }
        });
        const isLatestRequest = latestRequestIdRef.current === requestId;
        if (isRAQIV2LoadingException(e)) {
          setRequestState((previousState) => ({
            makeRequest,
            isDataLoading: pendingRequestIdByIdRef.current.size > 0,
            isResponseFailed: isLatestRequest ? false : previousState.isResponseFailed,
            isUserForbidden: isLatestRequest ? false : previousState.isUserForbidden,
            data: previousState.data,
          }));
          return;
        }

        const err = getResponseFromError(e);
        const errorCode = err?.status ?? 500;
        setRequestState((previousState) => ({
          makeRequest,
          isDataLoading: pendingRequestIdByIdRef.current.size > 0,
          isResponseFailed: isLatestRequest ? true : previousState.isResponseFailed,
          isUserForbidden: isLatestRequest
            ? errorCode === HttpStatusCodes.FORBIDDEN.valueOf()
            : previousState.isUserForbidden,
          data: shouldResetData
            ? new Map([
                ...(previousState.makeRequest === makeRequest
                  ? Array.from(previousState.data)
                  : []),
                ...ownedIds.map((id) => [id, null] as [IdType, null]),
              ])
            : previousState.data,
        }));
      }
    };
    void makeRequestAndUpdateState();
  }, [enabled, ids, makeRequest, ownsRequestState, requestState.data, trackRequestVersion]);

  const orderedData = useMemo(() => ids.map((id) => data.get(id) ?? null), [data, ids]);

  return {
    isDataLoading: !enabled || (ownsRequestState ? requestState.isDataLoading : ids.length > 0),
    isResponseFailed: ownsRequestState && requestState.isResponseFailed,
    isUserForbidden: ownsRequestState && requestState.isUserForbidden,
    data,
    orderedData,
    requestIdentity: makeRequest,
    // oxlint-disable-next-line react/react-compiler -- attempt counter is intentionally ref-backed to avoid a render/refetch loop
    requestVersion: requestVersionRef.current,
  };
};

export default useMappedApiRequest;
