import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import type { FunctionComponent } from 'react';
import React, { useContext, useMemo, useCallback } from 'react';
import type { SingleTreemapSeries } from '@rbx/analytics-ui';
import crashDumpsClient, {
  type CrashDumpData,
  type GetCrashDumpsRequest,
  type GetCrashDumpsResponse,
} from '@modules/clients/crashDumps';
import type {
  NonPaginatedRequest,
  PaginationResponse,
} from '@modules/experience-analytics-shared/hooks/usePaginatedRequest';
import convertCrashDumpToTreemapSeries from '../../adapters/serverMemoryDumpsTreemapAdapters';

const CRASH_DUMP_FILE_QUERY_KEY = ['crashDumps', 'getCrashDumpFile'] as const;
const CRASH_DUMP_FILE_STALE_TIME_MS = 5 * 60_000;

export const EMPTY_TREEMAP: SingleTreemapSeries = [];

const crashDumpFileQueryKey = (dumpId: string) => [...CRASH_DUMP_FILE_QUERY_KEY, dumpId] as const;

const fetchCrashDumpFileAsTreemap = (dumpId: string): Promise<SingleTreemapSeries> => {
  if (!dumpId) {
    return Promise.resolve(EMPTY_TREEMAP);
  }
  return crashDumpsClient.getCrashDumpFile({ dumpId }).then(convertCrashDumpToTreemapSeries);
};

/** Shared query options (ensureQueryData-compatible). Used by useCrashDumpFileQuery and getCrashDumpFile. */
const crashDumpFileQueryOptions = (dumpId: string | null) => ({
  queryKey: dumpId ? crashDumpFileQueryKey(dumpId) : crashDumpFileQueryKey(''),
  queryFn: () => fetchCrashDumpFileAsTreemap(dumpId ?? ''),
  staleTime: CRASH_DUMP_FILE_STALE_TIME_MS,
  retry: 5,
});

/**
 * useQuery for a single crash dump file as treemap series. Shares cache with getCrashDumpFile.
 * When dumpId is null, query is disabled and no request is made.
 */
export function useCrashDumpFileQuery(dumpId: string | null): UseQueryResult<SingleTreemapSeries> {
  return useQuery({
    ...crashDumpFileQueryOptions(dumpId),
    enabled: !!dumpId,
  });
}

export type GetCrashDumpsPaginatedRequest = {
  universeId: number;
  placeId?: number;
  startTime?: string;
  endTime?: string;
  pagination?: {
    paginationToken?: string;
    pageSize: number;
  };
};

export type CrashDumpsApiClient = {
  /**
   * Get list of crash dumps with pagination.
   */
  getCrashDumpsPaginated: (
    request: GetCrashDumpsPaginatedRequest,
  ) => Promise<PaginationResponse<CrashDumpData>>;

  /**
   * Get crash dump file as treemap series by dump ID with caching.
   */
  getCrashDumpFile: (dumpId: string) => Promise<SingleTreemapSeries>;
};

export const CrashDumpsClientContext = React.createContext<CrashDumpsApiClient>({
  getCrashDumpsPaginated: async () => ({ total: 0, values: [] }),
  getCrashDumpFile: async () => [],
});

export const useCrashDumpsClient = (): CrashDumpsApiClient => {
  const client = useContext(CrashDumpsClientContext);
  if (client === null) {
    throw new Error('useCrashDumpsClient must be used within a CrashDumpsClientProvider');
  }
  return client;
};

export const createCrashDumpsPaginatedRequest = (params: {
  universeId: number;
  placeId?: number;
  startTime?: string;
  endTime?: string;
}): NonPaginatedRequest<GetCrashDumpsPaginatedRequest> | undefined => {
  if (!params.universeId || !Number.isFinite(params.universeId)) {
    return undefined;
  }
  return {
    universeId: params.universeId,
    placeId: params.placeId,
    startTime: params.startTime,
    endTime: params.endTime,
  };
};

const CrashDumpsClientProvider: FunctionComponent<React.PropsWithChildren> = ({ children }) => {
  const queryClient = useQueryClient();

  const fetchCrashDumps = useCallback(
    async (request: GetCrashDumpsRequest): Promise<GetCrashDumpsResponse> => {
      const { universeId, placeId, startTime, endTime, offset = 0, limit = 10 } = request;

      if (!universeId || !Number.isFinite(universeId)) {
        return { total: 0, data: [] };
      }

      const queryKey = [
        'crashDumps',
        'getCrashDumps',
        universeId,
        placeId,
        startTime,
        endTime,
        offset,
        limit,
      ] as const;

      return queryClient.ensureQueryData({
        queryKey,
        queryFn: () => crashDumpsClient.getCrashDumps(request),
        staleTime: 60_000,
      });
    },
    [queryClient],
  );

  const getCrashDumpsPaginated = useCallback(
    async (request: GetCrashDumpsPaginatedRequest): Promise<PaginationResponse<CrashDumpData>> => {
      const { universeId, placeId, startTime, endTime, pagination } = request;
      const offset = pagination?.paginationToken ? parseInt(pagination.paginationToken, 10) : 0;

      const apiRequest: GetCrashDumpsRequest = {
        universeId,
        placeId,
        startTime,
        endTime,
        offset,
        limit: pagination?.pageSize,
      };

      const { data, total } = await fetchCrashDumps(apiRequest);

      const nextOffset = offset + data.length;
      const hasMore = nextOffset < total;

      return {
        total,
        values: data,
        // Use next offset as pagination token, or null if no more data
        nextPaginationToken: hasMore ? nextOffset.toString() : null,
      };
    },
    [fetchCrashDumps],
  );

  const getCrashDumpFile = useCallback(
    async (dumpId: string | null): Promise<SingleTreemapSeries> => {
      if (!dumpId) {
        return EMPTY_TREEMAP;
      }
      return queryClient.ensureQueryData(crashDumpFileQueryOptions(dumpId));
    },
    [queryClient],
  );

  const context = useMemo<CrashDumpsApiClient>(
    () => ({
      getCrashDumpsPaginated,
      getCrashDumpFile,
    }),
    [getCrashDumpsPaginated, getCrashDumpFile],
  );

  return (
    <CrashDumpsClientContext.Provider value={context}>{children}</CrashDumpsClientContext.Provider>
  );
};

export default CrashDumpsClientProvider;
