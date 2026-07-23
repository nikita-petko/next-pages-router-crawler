import type { FC } from 'react';
import React, { createContext, useContext, useMemo, useCallback, useState, useRef } from 'react';
import type { SingleTreemapSeries } from '@rbx/analytics-ui';
import { RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import type { GenericChartState } from '@modules/charts-generic/charts/types/ChartTypes';
import type { CrashDumpData } from '@modules/clients/crashDumps';
import { getResponseFromError } from '@modules/clients/utils';
import usePaginatedRequest, {
  type PaginatedRequestState,
} from '@modules/experience-analytics-shared/hooks/usePaginatedRequest';
import type RAQIV2ChartContext from '@modules/experience-analytics-shared/types/RAQIV2ChartContext';
import { HttpStatusCodes } from '@modules/miscellaneous/common';
import {
  useCrashDumpsClient,
  createCrashDumpsPaginatedRequest,
  useCrashDumpFileQuery,
} from './CrashDumpsClientProvider';

const DEFAULT_PAGE_SIZE = 10;

type ServerMemoryDumpsDataContextType = PaginatedRequestState<CrashDumpData> & {
  selectedDumpId: string | null;
  onSelectDumpId: (dumpId: string | null) => void;
  selectedCrashDumpFile: SingleTreemapSeries;
  selectedCrashDumpFileState: GenericChartState;
};

const ServerMemoryDumpsDataContext = createContext<ServerMemoryDumpsDataContextType | null>(null);

export const useServerMemoryDumpsData = (): ServerMemoryDumpsDataContextType => {
  const context = useContext(ServerMemoryDumpsDataContext);
  if (context === null) {
    throw new Error('useServerMemoryDumpsData must be used within a ServerMemoryDumpsDataProvider');
  }
  return context;
};

type ServerMemoryDumpsDataProviderProps = {
  chartContext: RAQIV2ChartContext;
  children: React.ReactNode;
};

const ServerMemoryDumpsDataProvider: FC<ServerMemoryDumpsDataProviderProps> = ({
  chartContext,
  children,
}) => {
  const client = useCrashDumpsClient();

  const {
    timeSpec: { startTime, endTime },
    resource: { id: universeId },
    filter,
  } = chartContext;

  const placeId = useMemo(() => {
    const placeFilter = filter?.find((f) => f.dimension === RAQIV2Dimension.Place);
    const placeIdFromFilter = placeFilter?.values[0];
    return placeIdFromFilter ? Number(placeIdFromFilter) : undefined;
  }, [filter]);

  const [selectedDumpId, setSelectedDumpId] = useState<string | null>(null);

  const paginatedRequest = useMemo(
    () =>
      universeId && universeId > 0
        ? createCrashDumpsPaginatedRequest({
            universeId,
            placeId,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
          })
        : undefined,
    [universeId, placeId, startTime, endTime],
  );

  // Synchronous reset instead of useEffect to avoid an extra render cycle
  // that would re-render the expensive treemap with stale data before clearing it.
  const prevPaginatedRequestRef = useRef(paginatedRequest);
  if (prevPaginatedRequestRef.current !== paginatedRequest) {
    prevPaginatedRequestRef.current = paginatedRequest;
    setSelectedDumpId(null);
  }

  const paginatedState = usePaginatedRequest(
    paginatedRequest,
    client.getCrashDumpsPaginated,
    DEFAULT_PAGE_SIZE,
  );

  const onSelectDumpId = useCallback((dumpId: string | null) => {
    setSelectedDumpId(dumpId);
  }, []);

  const { isFetching, isError, error, data } = useCrashDumpFileQuery(selectedDumpId);
  const selectedCrashDumpFile = useMemo(
    () => (!data || isFetching ? [] : data),
    [data, isFetching],
  );
  const selectedCrashDumpFileState = useMemo((): GenericChartState => {
    const err = error instanceof Error ? error : null;
    const resErr = error ? getResponseFromError(err) : null;
    return {
      isDataLoading: isFetching,
      isResponseFailed: isError,
      isUserForbidden: resErr?.status === HttpStatusCodes.FORBIDDEN,
      error: err,
    };
  }, [error, isError, isFetching]);

  const contextValue = useMemo<ServerMemoryDumpsDataContextType>(
    () => ({
      ...paginatedState,
      selectedDumpId,
      onSelectDumpId,
      selectedCrashDumpFile,
      selectedCrashDumpFileState,
    }),
    [
      paginatedState,
      selectedDumpId,
      onSelectDumpId,
      selectedCrashDumpFile,
      selectedCrashDumpFileState,
    ],
  );

  return (
    <ServerMemoryDumpsDataContext.Provider value={contextValue}>
      {children}
    </ServerMemoryDumpsDataContext.Provider>
  );
};

export default ServerMemoryDumpsDataProvider;
