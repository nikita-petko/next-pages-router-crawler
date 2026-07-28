import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { listMockClientLogs, type ListClientLogsResponse } from '../mockData/clientLogs';

const DEFAULT_PAGE_SIZE = 10;

export type UseClientLogsParams = {
  readonly sessionId: string | undefined;
  readonly pageToken?: string;
  readonly pageSize?: number;
};

export const getClientLogsQueryKey = ({
  sessionId,
  pageToken,
  pageSize = DEFAULT_PAGE_SIZE,
}: UseClientLogsParams) =>
  ['universe-observability', 'client-logs', sessionId, pageToken, pageSize] as const;

const useClientLogs = ({
  sessionId,
  pageToken,
  pageSize = DEFAULT_PAGE_SIZE,
}: UseClientLogsParams) =>
  useQuery<ListClientLogsResponse>({
    queryKey: getClientLogsQueryKey({ sessionId, pageToken, pageSize }),
    queryFn: () => {
      if (!sessionId) {
        throw new Error('A session ID is required to load client logs.');
      }

      return listMockClientLogs({
        sessionId,
        maxPageSize: pageSize,
        pageToken,
      });
    },
    enabled: sessionId != null && sessionId.length > 0,
    placeholderData: keepPreviousData,
  });

export default useClientLogs;
