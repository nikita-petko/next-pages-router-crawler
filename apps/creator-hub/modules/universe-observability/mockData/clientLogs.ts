import type { ClientSessionLog } from '../types/ClientSession';
import { ClientSessionLogSeverity } from '../types/ClientSession';

const DEFAULT_PAGE_SIZE = 10;
const MOCK_RESPONSE_DELAY_MS = 1000;
const MOCK_LOG_INTERVAL_MS = 3 * 60 * 1000;
const MOCK_LOG_START_TIME_MS = new Date('2025-10-30T15:57:00Z').getTime();

type MockClientLogDefinition = Pick<ClientSessionLog, 'message' | 'severity' | 'skipped'>;

const MOCK_CLIENT_LOG_DEFINITIONS: readonly MockClientLogDefinition[] = [
  {
    severity: ClientSessionLogSeverity.Error,
    message: "Failed to connect to DataStore 'PlayerProgression'.",
    skipped: 0,
  },
  {
    severity: ClientSessionLogSeverity.Warning,
    message: 'Invalid asset ID provided for character load. Falling back to default.',
    skipped: 2,
  },
  {
    severity: ClientSessionLogSeverity.Output,
    message: 'DataModel loading completed.',
    skipped: 0,
  },
  {
    severity: ClientSessionLogSeverity.Info,
    message: 'Client session connected to game server.',
    skipped: 0,
  },
  {
    severity: ClientSessionLogSeverity.Warning,
    message: 'Network receive queue exceeded the expected latency threshold.',
    skipped: 1,
  },
  {
    severity: ClientSessionLogSeverity.Info,
    message: 'Streaming region around the player was updated.',
    skipped: 0,
  },
  {
    severity: ClientSessionLogSeverity.Output,
    message: 'ReplicatedFirst finished removing the default loading screen.',
    skipped: 0,
  },
  {
    severity: ClientSessionLogSeverity.Error,
    message: "Players.LocalPlayer.PlayerScripts.Inventory:84: attempt to index nil with 'Name'.",
    skipped: 3,
  },
  {
    severity: ClientSessionLogSeverity.Info,
    message: 'Avatar appearance loaded successfully.',
    skipped: 0,
  },
  {
    severity: ClientSessionLogSeverity.Warning,
    message: 'Texture quality was reduced because of device memory pressure.',
    skipped: 0,
  },
  {
    severity: ClientSessionLogSeverity.Output,
    message: 'Camera controller initialized.',
    skipped: 0,
  },
  {
    severity: ClientSessionLogSeverity.Info,
    message: 'Experience settings synchronized with the server.',
    skipped: 0,
  },
  {
    severity: ClientSessionLogSeverity.Warning,
    message: 'Audio playback was delayed while content was downloaded.',
    skipped: 4,
  },
  {
    severity: ClientSessionLogSeverity.Error,
    message: 'MarketplaceService request failed with status code 503.',
    skipped: 0,
  },
  {
    severity: ClientSessionLogSeverity.Output,
    message: 'Input bindings registered for keyboard, gamepad, and touch.',
    skipped: 0,
  },
  {
    severity: ClientSessionLogSeverity.Info,
    message: 'Client telemetry batch uploaded.',
    skipped: 0,
  },
  {
    severity: ClientSessionLogSeverity.Warning,
    message: 'Frame rate remained below 30 FPS for five seconds.',
    skipped: 6,
  },
  {
    severity: ClientSessionLogSeverity.Output,
    message: 'Localization tables loaded for the current locale.',
    skipped: 0,
  },
  {
    severity: ClientSessionLogSeverity.Error,
    message: 'Unable to deserialize cached player preferences.',
    skipped: 1,
  },
  {
    severity: ClientSessionLogSeverity.Info,
    message: 'Voice chat eligibility check completed.',
    skipped: 0,
  },
  {
    severity: ClientSessionLogSeverity.Output,
    message: 'User interface mounted successfully.',
    skipped: 0,
  },
  {
    severity: ClientSessionLogSeverity.Warning,
    message: 'A remote event invocation was throttled.',
    skipped: 8,
  },
  {
    severity: ClientSessionLogSeverity.Info,
    message: 'Initial place assets finished preloading.',
    skipped: 0,
  },
  {
    severity: ClientSessionLogSeverity.Output,
    message: 'Client bootstrap started.',
    skipped: 0,
  },
];

export type ListClientLogsRequest = {
  readonly sessionId: string;
  readonly maxPageSize?: number;
  readonly pageToken?: string;
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

export const listMockClientLogs = async ({
  sessionId,
  maxPageSize = DEFAULT_PAGE_SIZE,
  pageToken,
}: ListClientLogsRequest): Promise<ListClientLogsResponse> => {
  await waitForMockResponse();

  const offset = getPageOffset(pageToken);
  const pageSize = Math.max(1, maxPageSize);
  const clientLogs = MOCK_CLIENT_LOG_DEFINITIONS.slice(offset, offset + pageSize).map(
    (definition, pageIndex): ClientSessionLog => {
      const logIndex = offset + pageIndex;
      return {
        id: `client-log-${logIndex + 1}`,
        sessionId,
        ...definition,
        createTime: new Date(MOCK_LOG_START_TIME_MS - logIndex * MOCK_LOG_INTERVAL_MS),
      };
    },
  );
  const nextOffset = offset + clientLogs.length;

  return {
    clientLogs,
    nextPageToken: nextOffset < MOCK_CLIENT_LOG_DEFINITIONS.length ? String(nextOffset) : null,
    totalCount: MOCK_CLIENT_LOG_DEFINITIONS.length,
  };
};
