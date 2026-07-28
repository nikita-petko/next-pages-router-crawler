import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import type {
  GameServerLog as ApiServerLog,
  ListGameServerLogsResponse,
} from '@rbx/client-server-management-service/v1';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { serverManagementApi } from '../clients/serverManagementApi';
import { LOGS_QUERY_CONSTANTS } from '../constants';
import type { GameServerLog } from '../types/GameServerLog';
import type { GameServerLogFilters } from '../types/GameServerLogControls';

// Backend severity enum: Output=0, Info=1, Warning=2, Error=3
const SEVERITY_ENUM = {
  output: 0,
  info: 1,
  warning: 2,
  error: 3,
} as const;

const SEVERITY_KEYS = ['output', 'info', 'warning', 'error'] as const;

function filterToQuery(filter: GameServerLogFilters) {
  const parts: string[] = [];

  if (filter.severity) {
    const severityFilter = filter.severity;
    const selectedSeverities = SEVERITY_KEYS.filter((key) => severityFilter[key]).map(
      (key) => SEVERITY_ENUM[key],
    );

    // Only add the filter if the selected severities are different from all possible severities
    if (selectedSeverities.length !== SEVERITY_KEYS.length) {
      if (selectedSeverities.length > 0) {
        parts.push(`severity in [${selectedSeverities.join(', ')}]`);
      }
    }
  }

  if (filter.search && filter.search.length > 0) {
    const escaped = filter.search.replaceAll('\\', '\\\\').replaceAll('"', '\\"');
    parts.push(`search == "${escaped}"`);
  }

  if (filter.dateRange?.min) {
    parts.push(`message_timestamp >= "${filter.dateRange.min.toISOString()}"`);
  }

  if (filter.dateRange?.max) {
    parts.push(`message_timestamp <= "${filter.dateRange.max.toISOString()}"`);
  }

  return parts.length > 0 ? parts.join(' && ') : undefined;
}

function mapResponseLogs(response: ListGameServerLogsResponse): GameServerLog[] {
  return (response.gameServerLogs ?? [])
    .filter(
      (log: ApiServerLog): log is ApiServerLog & { messageTimestampMs: Date; jobId: string } =>
        !!log.messageTimestampMs && !!log.jobId,
    )
    .map((log) => {
      // Map log.severity to a translation key string using SEVERITY_ENUM.
      let severity: GameServerLog['severity'] = '';
      if (log.severity !== undefined && log.severity !== null) {
        switch (log.severity as number) {
          case SEVERITY_ENUM.output:
            severity = 'LogSeverity.Output';
            break;
          case SEVERITY_ENUM.info:
            severity = 'LogSeverity.Info';
            break;
          case SEVERITY_ENUM.warning:
            severity = 'LogSeverity.Warning';
            break;
          case SEVERITY_ENUM.error:
            severity = 'LogSeverity.Error';
            break;
          default:
            severity = '';
        }
      }

      return {
        id: crypto.randomUUID(),
        messageTimestampMs: log.messageTimestampMs,
        universeId: log.universeId ?? 0,
        placeId: log.placeId ?? '',
        placeVersion: log.placeVersion ?? '',
        jobId: log.jobId,
        severity,
        message: log.message ?? '',
        stackTrace: log.stackTrace,
        messageTemplate: log.messageTemplate,
        context: log.context,
        skippedCount: log.skippedCount,
        rateLimitedCount: log.rateLimitedCount,
      };
    });
}

type UseGameServerLogsParams = {
  placeId: number | undefined;
  jobId: string | undefined;
  versionNumber?: string;
  orderBy?: string;
  pageSize?: number;
  filter?: GameServerLogFilters;
};

const useGameServerLogs = ({
  placeId,
  jobId,
  versionNumber = '*',
  orderBy = 'message_timestamp desc',
  pageSize = LOGS_QUERY_CONSTANTS.DEFAULT_PAGE_SIZE,
  filter,
}: UseGameServerLogsParams) => {
  const { gameDetails } = useCurrentGame();
  const universeId = gameDetails?.id;

  const filterString = useMemo(() => {
    if (filter) {
      return filterToQuery(filter);
    }
    return undefined;
  }, [filter]);

  return useInfiniteQuery({
    queryKey: [
      'server-management',
      'game-server-logs',
      { universeId, placeId, jobId, versionNumber, orderBy, filterString, pageSize },
    ],
    queryFn: async ({ pageParam: pageToken, signal }) => {
      if (!universeId || !placeId || !jobId) {
        return { logs: [], nextPageToken: undefined };
      }
      const response = await serverManagementApi.gameServersListGameServerLogs(
        {
          universeId,
          placeId,
          versionNumber,
          jobId,
          maxPageSize: pageSize,
          pageToken: pageToken || undefined,
          orderBy,
          filter: filterString,
        },
        { signal },
      );
      return {
        logs: mapResponseLogs(response),
        nextPageToken: response.nextPageToken ?? undefined,
      };
    },
    initialPageParam: '',
    getNextPageParam: (lastPage) => lastPage?.nextPageToken,
    retry: LOGS_QUERY_CONSTANTS.DEFAULT_RETRIES,
    staleTime: LOGS_QUERY_CONSTANTS.DEFAULT_STALE_TIME_MS,
    enabled: !!universeId && !!placeId && !!jobId,
  });
};

export default useGameServerLogs;
