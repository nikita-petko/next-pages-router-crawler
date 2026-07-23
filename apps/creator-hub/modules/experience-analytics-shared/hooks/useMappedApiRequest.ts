import { GenericChartState } from '@modules/charts-generic';
import { getResponseFromError } from '@modules/clients/utils';
import { HttpStatusCodes } from '@modules/miscellaneous/common';

import { useState, useEffect, useMemo, useRef } from 'react';
import { isRAQIV2LoadingException } from '../utils/RAQIV2InternalException';

type MappedApiRequestResponse<IdType, ResponseType> = {
  data: Map<IdType, ResponseType | null>;
  orderedData: (ResponseType | null)[];
} & GenericChartState;

const useMappedApiRequest = <IdType, ResponseType>(
  ids: IdType[],
  makeRequest: (ids: IdType[]) => Promise<Map<IdType, ResponseType>>,
): MappedApiRequestResponse<IdType, ResponseType> => {
  const [isDataLoading, setDataLoading] = useState<boolean>(true);
  const [isResponseFailed, setResponseFailure] = useState<boolean>(false);
  const [isUserForbidden, setUserForbidden] = useState<boolean>(false);
  const [data, setData] = useState<Map<IdType, ResponseType | null>>(new Map());
  const previousMakeRequest = useRef(makeRequest);

  useEffect(() => {
    const shouldResetData = previousMakeRequest.current !== makeRequest;
    let newIds: IdType[] = [];
    if (shouldResetData) {
      // makeRequest has changed, clear cached values
      newIds = ids;
      setDataLoading(true);
      setUserForbidden(false);
      setResponseFailure(false);
      previousMakeRequest.current = makeRequest;
    } else {
      newIds = ids.filter((id) => !data.has(id));
    }

    if (newIds.length === 0) {
      setDataLoading(false);
      return;
    }

    const makeRequestAndUpdateState = async () => {
      try {
        const responseMap = await makeRequest(newIds);
        setData((prevData) => {
          return new Map([
            ...(shouldResetData ? [] : Array.from(prevData)),
            // fill in ids that did not receive a response with null
            ...newIds.map((id) => [id, null] as [IdType, null]),
            ...Array.from(responseMap),
          ]);
        });
        setResponseFailure(false);
        setUserForbidden(false);
      } catch (e) {
        if (isRAQIV2LoadingException(e)) {
          // still loading; nothing to do here
          return;
        }

        const err = getResponseFromError(e);
        const errorCode = err?.status ?? 500;
        // clear old data on error if we are resetting the state
        if (shouldResetData) {
          setData(new Map(newIds.map((id) => [id, null] as [IdType, null])));
        }
        setResponseFailure(true);
        setUserForbidden(errorCode === HttpStatusCodes.FORBIDDEN);
      } finally {
        setDataLoading(false);
      }
    };
    makeRequestAndUpdateState();
  }, [ids, data, makeRequest]);

  const orderedData = useMemo(() => ids.map((id) => data.get(id) ?? null), [data, ids]);

  return {
    isDataLoading,
    isResponseFailed,
    isUserForbidden,
    data,
    orderedData,
  };
};

export default useMappedApiRequest;
