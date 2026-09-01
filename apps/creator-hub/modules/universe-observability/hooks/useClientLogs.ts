import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { clientLogsApi } from '../clients/clientLogsApi';
import type { ApiClientLog, ListClientLogsResponse } from '../mockData/clientLogs';
import { ClientSessionLogSchema, type ClientSessionLog } from '../types/ClientSession';
import type { LogFilter } from '../types/Filters';
import { clientLogFilterToQuery } from '../utils/logFilters';

const DEFAULT_PAGE_SIZE = 50;
const DEFAULT_ORDER_BY = 'message_timestamp desc';
const DEFAULT_RETRIES = 3;
const DEFAULT_STALE_TIME_MS = 10 * 60 * 1000;
const EMPTY_CLIENT_LOGS: readonly ClientSessionLog[] = [];

// The endpoint does not provide a log ID. Derive one from immutable transport fields so a
// reordered refetch cannot transfer row state to a different log.
const getStableClientLogId = (log: ApiClientLog): string =>
  JSON.stringify([
    log.sessionId ?? null,
    log.messageTimestampMs?.getTime() ?? null,
    log.universeId ?? null,
    log.placeId ?? null,
    log.placeVersion ?? null,
    log.severity ?? null,
    log.message ?? null,
    log.stackTrace ?? null,
    log.messageTemplate ?? null,
    log.context ?? null,
    log.skippedCount ?? null,
    log.rateLimitedCount ?? null,
  ]);

const mapResponseLogs = (
  response: ListClientLogsResponse,
  pageToken: string | undefined,
): readonly ClientSessionLog[] =>
  (response.clientLogs ?? []).flatMap((log, logIndex) => {
    const parseResult = ClientSessionLogSchema.safeParse({
      id: getStableClientLogId(log),
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

      const response = await clientLogsApi.clientSessionsListClientLogs(
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
