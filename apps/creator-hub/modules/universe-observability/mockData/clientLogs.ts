import type { ClientSessionLog } from '../types/ClientSession';
import type { LogFilter } from '../types/Filters';
import { LogSeverity } from '../types/LogSeverity';

const DEFAULT_PAGE_SIZE = 10;
const MOCK_RESPONSE_DELAY_MS = 1000;
const MOCK_LOG_INTERVAL_MS = 3 * 60 * 1000;
const MOCK_LOG_START_TIME_MS = new Date('2025-10-30T15:57:00Z').getTime();

type MockClientLogDefinition = Pick<ClientSessionLog, 'message' | 'severity' | 'skipped'>;

const MOCK_CLIENT_LOG_DEFINITIONS: readonly MockClientLogDefinition[] = [
  {
    severity: LogSeverity.Error,
    message: "Failed to connect to DataStore 'PlayerProgression'.",
    skipped: 0,
  },
  {
    severity: LogSeverity.Warning,
    message: 'Invalid asset ID provided for character load. Falling back to default.',
    skipped: 2,
  },
  {
    severity: LogSeverity.Output,
    message: 'DataModel loading completed.',
    skipped: 0,
  },
  {
    severity: LogSeverity.Info,
    message: 'Client session connected to game server.',
    skipped: 0,
  },
  {
    severity: LogSeverity.Warning,
    message: 'Network receive queue exceeded the expected latency threshold.',
    skipped: 1,
  },
  {
    severity: LogSeverity.Info,
    message: 'Streaming region around the player was updated.',
    skipped: 0,
  },
  {
    severity: LogSeverity.Output,
    message: 'ReplicatedFirst finished removing the default loading screen.',
    skipped: 0,
  },
  {
    severity: LogSeverity.Error,
    message: "Players.LocalPlayer.PlayerScripts.Inventory:84: attempt to index nil with 'Name'.",
    skipped: 3,
  },
  {
    severity: LogSeverity.Info,
    message: 'Avatar appearance loaded successfully.',
    skipped: 0,
  },
  {
    severity: LogSeverity.Warning,
    message: 'Texture quality was reduced because of device memory pressure.',
    skipped: 0,
  },
  {
    severity: LogSeverity.Output,
    message: 'Camera controller initialized.',
    skipped: 0,
  },
  {
    severity: LogSeverity.Info,
    message: 'Experience settings synchronized with the server.',
    skipped: 0,
  },
  {
    severity: LogSeverity.Warning,
    message: 'Audio playback was delayed while content was downloaded.',
    skipped: 4,
  },
  {
    severity: LogSeverity.Error,
    message: 'MarketplaceService request failed with status code 503.',
    skipped: 0,
  },
  {
    severity: LogSeverity.Output,
    message: 'Input bindings registered for keyboard, gamepad, and touch.',
    skipped: 0,
  },
  {
    severity: LogSeverity.Info,
    message: 'Client telemetry batch uploaded.',
    skipped: 0,
  },
  {
    severity: LogSeverity.Warning,
    message: 'Frame rate remained below 30 FPS for five seconds.',
    skipped: 6,
  },
  {
    severity: LogSeverity.Output,
    message: 'Localization tables loaded for the current locale.',
    skipped: 0,
  },
  {
    severity: LogSeverity.Error,
    message: 'Unable to deserialize cached player preferences.',
    skipped: 1,
  },
  {
    severity: LogSeverity.Info,
    message: 'Voice chat eligibility check completed.',
    skipped: 0,
  },
  {
    severity: LogSeverity.Output,
    message: 'User interface mounted successfully.',
    skipped: 0,
  },
  {
    severity: LogSeverity.Warning,
    message: 'A remote event invocation was throttled.',
    skipped: 8,
  },
  {
    severity: LogSeverity.Info,
    message: 'Initial place assets finished preloading.',
    skipped: 0,
  },
  {
    severity: LogSeverity.Output,
    message: 'Client bootstrap started.',
    skipped: 0,
  },
];

export type ListClientLogsRequest = {
  readonly sessionId: string;
  readonly maxPageSize?: number;
  readonly pageToken?: string;
  readonly filter?: LogFilter;
};

export type ListClientLogsResponse = {
  readonly clientLogs: readonly ClientSessionLog[];
  readonly nextPageToken: string | null;
  readonly totalCount: number;
};

const waitForMockResponse = async (): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, MOCK_RESPONSE_DELAY_MS);
  });

const getPageOffset = (pageToken: string | undefined): number => {
  if (!pageToken) {
    return 0;
  }

  const offset = Number.parseInt(pageToken, 10);
  return Number.isNaN(offset) || offset < 0 ? 0 : offset;
};

const isWithinDateRange = (log: ClientSessionLog, dateRange: LogFilter['dateRange']): boolean => {
  if (!dateRange) {
    return true;
  }

  const createTime = log.createTime.getTime();
  const isAtOrAfterMin = dateRange.min === undefined || createTime >= dateRange.min.getTime();
  const isAtOrBeforeMax = dateRange.max === undefined || createTime <= dateRange.max.getTime();
  return isAtOrAfterMin && isAtOrBeforeMax;
};

const matchesSeverity = (log: ClientSessionLog, severity: LogFilter['severity']): boolean =>
  severity === undefined || log.severity === severity;

export const listMockClientLogs = async ({
  sessionId,
  maxPageSize = DEFAULT_PAGE_SIZE,
  pageToken,
  filter,
}: ListClientLogsRequest): Promise<ListClientLogsResponse> => {
  await waitForMockResponse();

  const offset = getPageOffset(pageToken);
  const pageSize = Math.max(1, maxPageSize);
  const filteredClientLogs = MOCK_CLIENT_LOG_DEFINITIONS.map(
    (definition, logIndex): ClientSessionLog => {
      return {
        id: `client-log-${logIndex + 1}`,
        sessionId,
        ...definition,
        createTime: new Date(MOCK_LOG_START_TIME_MS - logIndex * MOCK_LOG_INTERVAL_MS),
      };
    },
  ).filter(
    (log) => isWithinDateRange(log, filter?.dateRange) && matchesSeverity(log, filter?.severity),
  );
  const clientLogs = filteredClientLogs.slice(offset, offset + pageSize);
  const nextOffset = offset + clientLogs.length;

  return {
    clientLogs,
    nextPageToken: nextOffset < filteredClientLogs.length ? String(nextOffset) : null,
    totalCount: filteredClientLogs.length,
  };
};
