import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import type { ListClientLogsResponse } from '@rbx/client-server-management-service/v1';
import { gameObservabilityApi } from '../clients/gameObservabilityApi';
import { ClientSessionLogSchema, type ClientSessionLog } from '../types/ClientSession';
import type { LogFilter } from '../types/Filters';
import { clientLogFilterToQuery } from '../utils/logFilters';

const DEFAULT_PAGE_SIZE = 50;
const DEFAULT_ORDER_BY = 'message_timestamp desc';
const DEFAULT_RETRIES = 3;
const DEFAULT_STALE_TIME_MS = 10 * 60 * 1000;
const EMPTY_CLIENT_LOGS: readonly ClientSessionLog[] = [];

const mapResponseLogs = (
  response: ListClientLogsResponse,
  pageToken: string | undefined,
): readonly ClientSessionLog[] =>
  (response.clientLogs ?? []).flatMap((log, logIndex) => {
    const parseResult = ClientSessionLogSchema.safeParse({
      id: crypto.randomUUID(),
      sessionId: log.sessionId,
      severity: log.severity,
      message: log.message ?? '',
      skipped: log.skippedCount ?? 0,
      createTime: log.messageTimestampMs,
      stackTrace: log.stackTrace ?? undefined,
    });
    if (!parseResult.success) {
      console.error('Failed to parse client log response.', {
        error: parseResult.error,
        logIndex,
        pageToken,
      });
      return [];
    }
    return [parseResult.data];
  });

export type UseClientLogsParams = {
  readonly universeId: number | undefined;
  readonly sessionId: string | undefined;
  readonly pageSize?: number;
  readonly orderBy?: string;
  readonly filter?: LogFilter;
};

export const getClientLogsQueryKey = ({
  universeId,
  sessionId,
  pageSize = DEFAULT_PAGE_SIZE,
  orderBy = DEFAULT_ORDER_BY,
  filter,
}: UseClientLogsParams) =>
  [
    'universe-observability',
    'client-logs',
    {
      universeId,
      sessionId,
      pageSize,
      orderBy,
      filter: clientLogFilterToQuery(filter),
    },
  ] as const;

const useClientLogs = ({
  universeId,
  sessionId,
  pageSize = DEFAULT_PAGE_SIZE,
  orderBy = DEFAULT_ORDER_BY,
  filter,
}: UseClientLogsParams) => {
  const filterString = useMemo(() => clientLogFilterToQuery(filter), [filter]);

  return useInfiniteQuery({
    queryKey: getClientLogsQueryKey({ universeId, sessionId, pageSize, orderBy, filter }),
    queryFn: async ({ pageParam: pageToken, signal }) => {
      if (!universeId || !sessionId) {
        return { logs: EMPTY_CLIENT_LOGS, nextPageToken: undefined };
      }

      const response = await gameObservabilityApi.gameServersListClientLogs(
        {
          universeId,
          sessionId,
          maxPageSize: pageSize,
          pageToken: pageToken || undefined,
          orderBy,
          filter: filterString,
        },
        { signal },
      );

      return {
        logs: mapResponseLogs(response, pageToken || undefined),
        nextPageToken: response.nextPageToken ?? undefined,
      };
    },
    initialPageParam: '',
    getNextPageParam: (lastPage) => lastPage.nextPageToken,
    enabled: universeId != null && universeId > 0 && sessionId != null && sessionId.length > 0,
    retry: DEFAULT_RETRIES,
    staleTime: DEFAULT_STALE_TIME_MS,
  });
};

export default useClientLogs;
