import { useCallback, useReducer, useMemo, useEffect } from 'react';
import { HttpStatusCodes } from '@modules/miscellaneous/common';
import { getResponseFromError } from '@modules/clients/utils';

type State<RequestType, DataType> = {
  isDataLoading: boolean;
  isResponseFailed: boolean;
  isUserForbidden: boolean;
  request: RequestType | null;
  page: number;
  total?: number;
  nextCursor: string;
  data: DataType[];
  pageSize: number;
  hasAttemptedInitialFetch: boolean;
};

type Action<RequestType, DataType> =
  | {
      type: 'request';
      request: RequestType;
    }
  | {
      type: 'success';
      results: {
        data: DataType[];
        nextCursor: string;
        total?: number;
      };
      request: RequestType;
    }
  | {
      type: 'failure';
      request: RequestType;
    }
  | {
      type: 'forbidden';
      request: RequestType;
    }
  | { type: 'nextPage' }
  | { type: 'previousPage' }
  | { type: 'reset' }
  | { type: 'setPageSize'; newPageSize: number };

type PaginationRequest = {
  pagination?: {
    paginationToken?: string | undefined;
    pageSize: number;
  };
};

export type NonPaginatedRequest<RequestType> = Omit<RequestType, keyof PaginationRequest>;

export type PaginationResponse<DataType> = {
  nextPaginationToken?: string | null;
  total?: number;
  values?: DataType[] | null;
};

const getInitialState = <RequestType, DataType>(
  initialPageSize: number,
): State<RequestType, DataType> => {
  return {
    isDataLoading: false,
    isResponseFailed: false,
    isUserForbidden: false,
    request: null,
    page: 0,
    nextCursor: '',
    data: [],
    pageSize: initialPageSize,
    hasAttemptedInitialFetch: false,
  };
};

const createReducer =
  <RequestType, DataType>() =>
  (
    state: State<RequestType, DataType>,
    action: Action<RequestType, DataType>,
  ): State<RequestType, DataType> => {
    const { type } = action;
    switch (type) {
      case 'request':
        return {
          ...state,
          isDataLoading: true,
          request: action.request,
          hasAttemptedInitialFetch: true,
        };
      case 'success': {
        if (state.request !== action.request) {
          return state;
        }

        const { data, nextCursor, total } = action.results;
        return {
          ...state,
          isDataLoading: false,
          isResponseFailed: false,
          total,
          nextCursor,
          request: null,
          data: [...state.data, ...data],
        };
      }
      case 'failure': {
        if (state.request !== action.request) {
          return state;
        }

        return {
          ...state,
          isDataLoading: false,
          isResponseFailed: true,
          isUserForbidden: false,
          request: null,
        };
      }
      case 'forbidden': {
        if (state.request !== action.request) {
          return state;
        }

        return {
          ...state,
          isDataLoading: false,
          isResponseFailed: false,
          isUserForbidden: true,
          request: null,
        };
      }
      // nextPage and previousPage only increments the page number, the actual fetching
      // of data is only performed in a useEffect if we do not have enough data for the
      // current page
      case 'nextPage':
        return {
          ...state,
          page:
            state.total !== undefined
              ? Math.min(
                  state.page + 1,
                  Math.max(0, Math.floor(Math.max(0, state.total - 1) / state.pageSize)),
                )
              : state.page + 1,
        };
      case 'previousPage':
        return { ...state, page: Math.max(state.page - 1, 0) };
      case 'reset':
        return getInitialState<RequestType, DataType>(state.pageSize);
      case 'setPageSize': {
        return {
          ...state,
          pageSize: action.newPageSize,
          page: Math.floor((state.page * state.pageSize) / action.newPageSize),
        };
      }
      default: {
        const exhaustiveCheck: never = type;
        throw new Error(`Unhandled severity ${exhaustiveCheck}`);
      }
    }
  };

export type PaginatedRequestState<DataType> = {
  data: DataType[];
  totalData: DataType[];
  isDataLoading: boolean;
  isUserForbidden: boolean;
  isResponseFailed: boolean;
  page: number;
  total?: number;
  nextPage: () => void;
  previousPage: () => void;
  pageSize: number;
  setPageSize: (newPageSize: number) => void;
  hasNext: boolean;
  hasPrevious: boolean;
};

const usePaginatedRequest = <RequestType, DataType>(
  nonPaginatedRequest: NonPaginatedRequest<RequestType> | undefined,
  fetchResponse: (request: RequestType) => Promise<PaginationResponse<DataType>>,
  initialPageSize: number | undefined,
  autoLoadAll?: boolean,
): PaginatedRequestState<DataType> => {
  const [
    {
      isDataLoading,
      isResponseFailed,
      isUserForbidden,
      page,
      total,
      nextCursor,
      data,
      request: activeRequest,
      pageSize,
      hasAttemptedInitialFetch,
    },
    dispatch,
  ] = useReducer(
    createReducer<RequestType, DataType>(),
    getInitialState<RequestType, DataType>(initialPageSize ?? 10),
  );

  const fetchPage = useCallback(
    async (cursor: string) => {
      if (!nonPaginatedRequest) {
        return;
      }

      // For unknown total: don't fetch if no cursor AND we already have some data
      if (total === undefined && cursor === '' && data.length > 0) {
        return;
      }

      const paginationRequest: PaginationRequest = {
        pagination: {
          pageSize,
          paginationToken: cursor,
        },
      };
      // NOTE(shumingxu, 08/23/2023): Type assertion is a bit hacky but Typescript refuses to acknowledge that Omit<A, B> & B = A
      // Seems like it's a known and ongoing issue with Typescript: https://github.com/microsoft/TypeScript/issues/28884#issuecomment-448356158
      const paginatedRequest = {
        ...nonPaginatedRequest,
        ...paginationRequest,
      } as RequestType;

      try {
        dispatch({ type: 'request', request: paginatedRequest });
        const response = await fetchResponse(paginatedRequest as RequestType);
        dispatch({
          type: 'success',
          results: {
            data: response.values ?? [],
            total: response.total,
            nextCursor: response.nextPaginationToken ?? '',
          },
          request: paginatedRequest,
        });
      } catch (e) {
        const err = getResponseFromError(e);
        const errorCode = err?.status ?? 500;
        if (errorCode === HttpStatusCodes.FORBIDDEN) {
          dispatch({ type: 'forbidden', request: paginatedRequest });
        } else {
          dispatch({ type: 'failure', request: paginatedRequest });
        }
      }
    },
    [pageSize, nonPaginatedRequest, fetchResponse, total, data.length],
  );

  const nextPage = useCallback(() => {
    dispatch({ type: 'nextPage' });
  }, []);

  const previousPage = useCallback(() => {
    dispatch({ type: 'previousPage' });
  }, []);

  const setPageSize = useCallback((newPageSize: number) => {
    dispatch({ type: 'setPageSize', newPageSize });
  }, []);

  const pageData = useMemo(() => {
    if (initialPageSize === undefined) {
      return data;
    }
    return data.slice(page * pageSize, (page + 1) * pageSize);
  }, [data, initialPageSize, page, pageSize]);

  // Reset & fetch new page when params have changed or first load
  useEffect(() => {
    dispatch({ type: 'reset' });
  }, [nonPaginatedRequest, fetchResponse]);

  // Fetch more data if we aren't making an active request, and don't have enough data for the current page
  useEffect(() => {
    const needsMoreDataForPage = (page + 1) * pageSize > data.length;

    let canFetchMore;
    if (total !== undefined) {
      // Known total: fetch if we have less data than total
      canFetchMore = data.length < total;
    } else {
      // Unknown total: fetch if we have a cursor, OR if this is the very first fetch attempt
      canFetchMore = nextCursor !== '' || !hasAttemptedInitialFetch;
    }

    const shouldFetch = (autoLoadAll ? true : needsMoreDataForPage) && canFetchMore;

    if (!activeRequest && shouldFetch && !isResponseFailed && !isUserForbidden) {
      fetchPage(nextCursor);
    }
  }, [
    fetchPage,
    nextCursor,
    page,
    pageSize,
    data.length,
    total,
    isResponseFailed,
    isUserForbidden,
    activeRequest,
    hasAttemptedInitialFetch,
    autoLoadAll,
  ]);

  const hasNext = useMemo(() => {
    if (activeRequest) {
      return false;
    }

    // If total is known, prefer total-based pagination regardless of cursor presence
    if (total !== undefined) {
      return total > (page + 1) * pageSize;
    }

    const hasMoreCachedData = data.length > (page + 1) * pageSize;
    const hasNextCursor = nextCursor !== '';

    return hasMoreCachedData || hasNextCursor;
  }, [nextCursor, page, pageSize, total, data.length, activeRequest]);

  const hasPrevious = useMemo(() => page > 0, [page]);

  return {
    isDataLoading,
    isResponseFailed,
    isUserForbidden,
    page,
    total,
    nextPage,
    previousPage,
    data: pageData,
    totalData: data,
    pageSize,
    setPageSize,
    hasNext,
    hasPrevious,
  };
};

export default usePaginatedRequest;
