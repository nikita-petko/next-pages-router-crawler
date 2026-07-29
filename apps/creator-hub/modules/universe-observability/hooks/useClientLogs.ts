import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { listMockClientLogs, type ListClientLogsResponse } from '../mockData/clientLogs';
import type { LogFilter } from '../types/Filters';

const DEFAULT_PAGE_SIZE = 10;

export type UseClientLogsParams = {
  readonly sessionId: string | undefined;
  readonly pageToken?: string;
  readonly pageSize?: number;
  readonly filter?: LogFilter;
};

export const getClientLogsQueryKey = ({
  sessionId,
  pageToken,
  pageSize = DEFAULT_PAGE_SIZE,
  filter,
}: UseClientLogsParams) =>
  ['universe-observability', 'client-logs', sessionId, pageToken, pageSize, filter] as const;

const useClientLogs = ({
  sessionId,
  pageToken,
  pageSize = DEFAULT_PAGE_SIZE,
  filter,
}: UseClientLogsParams) =>
  useQuery<ListClientLogsResponse>({
    queryKey: getClientLogsQueryKey({ sessionId, pageToken, pageSize, filter }),
    queryFn: () => {
      if (!sessionId) {
        throw new Error('A session ID is required to load client logs.');
      }

      return listMockClientLogs({
        sessionId,
        maxPageSize: pageSize,
        pageToken,
        filter,
      });
    },
    enabled: sessionId != null && sessionId.length > 0,
    placeholderData: keepPreviousData,
  });

export default useClientLogs;
