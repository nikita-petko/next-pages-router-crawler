import { LogSeverity } from '../types/LogSeverity';

/** Temporary transport contract. Delete this with the mock when generated client types exist. */
export type ApiClientLog = {
  readonly messageTimestampMs?: Date;
  readonly universeId?: number;
  readonly placeId?: string | null;
  readonly placeVersion?: string | null;
  readonly sessionId?: string | null;
  readonly severity?: LogSeverity;
  readonly message?: string | null;
  readonly stackTrace?: string | null;
  readonly messageTemplate?: string | null;
  readonly context?: string | null;
  readonly skippedCount?: number;
  readonly rateLimitedCount?: number;
};

export type ListClientLogsRequest = {
  readonly universeId: number;
  readonly sessionId: string;
  readonly maxPageSize?: number;
  readonly pageToken?: string;
  readonly orderBy?: string;
  readonly filter?: string;
};

export type ListClientLogsResponse = {
  readonly clientLogs?: readonly ApiClientLog[] | null;
  readonly nextPageToken?: string | null;
};

export type ClientLogsApi = {
  readonly clientSessionsListClientLogs: (
    request: ListClientLogsRequest,
    initOverrides?: RequestInit,
  ) => Promise<ListClientLogsResponse>;
};

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;
const MOCK_RESPONSE_DELAY_MS = 1000;
const MOCK_LOG_INTERVAL_MS = 3 * 60 * 1000;
const MOCK_LOG_START_TIME_MS = new Date('2026-07-29T19:57:00Z').getTime();
const MOCK_LOG_COUNT = 125;
const MOCK_PLACE_ID = '1818';
const MOCK_PLACE_VERSION = '1240';
const PAGE_TOKEN_PREFIX = 'client-logs-page-';
const DEFAULT_ORDER_BY = 'message_timestamp desc';
const ASCENDING_ORDER_BY = 'message_timestamp asc';

type MockClientLogDefinition = Pick<
  ApiClientLog,
  | 'context'
  | 'message'
  | 'messageTemplate'
  | 'rateLimitedCount'
  | 'severity'
  | 'skippedCount'
  | 'stackTrace'
>;

const MOCK_CLIENT_LOG_DEFINITIONS: readonly MockClientLogDefinition[] = [
  {
    severity: LogSeverity.Error,
    message:
      "Failed to connect to DataStore 'PlayerProgression' after 5 retry attempts because the request exceeded the client timeout while waiting for the regional endpoint; player progression will remain in memory and another save will be attempted before the session closes. Request ID 8f82d36b-28e4-4f97-a87f-0ca3c7b56014 originated from the automatic checkpoint worker for user 192837465, and the last acknowledged version was 47. If every remaining save attempt fails, the client will preserve the unsaved payload in the recovery queue and report the final outcome during disconnect telemetry.",
    skippedCount: 0,
    stackTrace:
      'DataStoreController.saveCheckpoint\nPlayerProgressionService.flush\nSessionController.disconnect',
    messageTemplate: 'Failed to connect to DataStore {dataStoreName} after {retryCount} attempts',
    context: '{"dataStoreName":"PlayerProgression","retryCount":5}',
  },
  {
    severity: LogSeverity.Warning,
    message:
      'Invalid asset ID 987654321012345 provided for character load while applying the saved avatar description. Falling back to the default character appearance so the player can continue joining while the requested shirt, pants, layered clothing, and accessory assets are validated. The rejected asset was referenced by outfit preset 30291 in slot UpperTorso and returned an ownership state that could not be reconciled with the cached avatar record. Remaining valid assets will still be applied, and the complete description will be requested again after the avatar service cache expires.',
    skippedCount: 2,
  },
  {
    severity: LogSeverity.Output,
    message: 'DataModel loading completed.',
    skippedCount: 0,
  },
  {
    severity: LogSeverity.Info,
    message: 'Client session connected to game server.',
    skippedCount: 0,
  },
  {
    severity: LogSeverity.Warning,
    message:
      'Network receive queue exceeded the expected latency threshold for 12 consecutive samples. Incoming replication packets are being processed more slowly than they arrive, which may cause delayed character movement, stale physics state, and visible corrections until the queue returns to normal. The queue currently contains 438 packets totaling 1.7 MB, the oldest packet has waited 842 ms, and measured round-trip latency is 316 ms with 8.4 percent packet loss. Replication detail for distant assemblies will be reduced temporarily while character and camera updates retain normal priority.',
    skippedCount: 1,
    rateLimitedCount: 4,
  },
  {
    severity: LogSeverity.Info,
    message: 'Streaming region around the player was updated.',
    skippedCount: 0,
  },
  {
    severity: LogSeverity.Output,
    message: 'ReplicatedFirst finished removing the default loading screen.',
    skippedCount: 0,
  },
  {
    severity: LogSeverity.Error,
    message:
      "Players.LocalPlayer.PlayerScripts.Inventory.Controllers.InventoryController:84: attempt to index nil with 'Name' while reconciling the equipped item returned by the server. The inventory update was discarded to avoid replacing the current client state with an incomplete payload. Stack trace: InventoryController.reconcileEquippedItem at line 84, InventoryController.applySnapshot at line 219, InventoryService.onSnapshotReceived at line 146, and ReplicatedStorage.Packages.Signal.fire at line 37. Snapshot revision 918 referenced item instance 4d92a7 without a matching catalog definition, so the previous equipped state will remain visible until a complete snapshot arrives.",
    skippedCount: 3,
    stackTrace:
      'InventoryController.reconcileEquippedItem:84\nInventoryController.applySnapshot:219\nInventoryService.onSnapshotReceived:146',
  },
  {
    severity: LogSeverity.Info,
    message: 'Avatar appearance loaded successfully.',
    skippedCount: 0,
  },
  {
    severity: LogSeverity.Warning,
    message: 'Texture quality was reduced because of device memory pressure.',
    skippedCount: 0,
  },
  {
    severity: LogSeverity.Output,
    message: 'Camera controller initialized.',
    skippedCount: 0,
  },
  {
    severity: LogSeverity.Info,
    message: 'Experience settings synchronized with the server.',
    skippedCount: 0,
  },
  {
    severity: LogSeverity.Warning,
    message: 'Audio playback was delayed while content was downloaded.',
    skippedCount: 4,
  },
  {
    severity: LogSeverity.Error,
    message:
      'MarketplaceService request failed with status code 503 while retrieving product information for developer product 1847293056. Purchase presentation has been deferred because the catalog response was unavailable after multiple attempts and could not be safely cached for this session. Correlation ID market-2d94e89f6c3a indicates that all three requests reached the upstream service but received a transient unavailable response after 1,500 ms. The purchase button will remain disabled, no currency was charged, and the product details panel will retry when the user reopens it or connectivity changes.',
    skippedCount: 0,
  },
  {
    severity: LogSeverity.Output,
    message: 'Input bindings registered for keyboard, gamepad, and touch.',
    skippedCount: 0,
  },
  {
    severity: LogSeverity.Info,
    message: 'Client telemetry batch uploaded.',
    skippedCount: 0,
  },
  {
    severity: LogSeverity.Warning,
    message: 'Frame rate remained below 30 FPS for five seconds.',
    skippedCount: 6,
    rateLimitedCount: 12,
  },
  {
    severity: LogSeverity.Output,
    message: 'Localization tables loaded for the current locale.',
    skippedCount: 0,
  },
  {
    severity: LogSeverity.Error,
    message: 'Unable to deserialize cached player preferences.',
    skippedCount: 1,
  },
  {
    severity: LogSeverity.Info,
    message: 'Voice chat eligibility check completed.',
    skippedCount: 0,
  },
  {
    severity: LogSeverity.Output,
    message: 'User interface mounted successfully.',
    skippedCount: 0,
  },
  {
    severity: LogSeverity.Warning,
    message:
      "Remote event invocation for 'UpdatePlayerLoadout' was throttled after the client exceeded the configured per-minute request budget. Additional calls with the same payload will be dropped temporarily to protect server capacity and prevent duplicate inventory mutations. The client sent 127 invocations during the last 60-second window against a limit of 40, with 96 requests containing an identical loadout revision. Event delivery will resume after a 12-second cooldown; the most recent desired loadout has been retained locally and will be submitted once when the throttle expires.",
    skippedCount: 8,
    rateLimitedCount: 87,
  },
  {
    severity: LogSeverity.Info,
    message: 'Initial place assets finished preloading.',
    skippedCount: 0,
  },
  {
    severity: LogSeverity.Output,
    message: 'Client bootstrap started.',
    skippedCount: 0,
  },
];

const waitForMockResponse = async (signal?: AbortSignal | null): Promise<void> =>
  new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('The operation was aborted.', 'AbortError'));
      return;
    }

    const handleAbort = () => {
      clearTimeout(timeoutId);
      reject(new DOMException('The operation was aborted.', 'AbortError'));
    };
    const timeoutId = setTimeout(() => {
      signal?.removeEventListener('abort', handleAbort);
      resolve();
    }, MOCK_RESPONSE_DELAY_MS);
    signal?.addEventListener('abort', handleAbort, { once: true });
  });

const getPageOffset = (pageToken: string | undefined): number => {
  if (!pageToken) {
    return 0;
  }

  if (!pageToken.startsWith(PAGE_TOKEN_PREFIX)) {
    throw new TypeError('Invalid client logs page token.');
  }

  const encodedOffset = pageToken.slice(PAGE_TOKEN_PREFIX.length);
  const offset = Number.parseInt(encodedOffset, 36);
  if (Number.isNaN(offset) || offset < 0 || offset.toString(36) !== encodedOffset) {
    throw new TypeError('Invalid client logs page token.');
  }
  return offset;
};

const getNextPageToken = (offset: number): string => `${PAGE_TOKEN_PREFIX}${offset.toString(36)}`;

type ParsedLogFilter = {
  readonly minTimestamp?: Date;
  readonly maxTimestamp?: Date;
  readonly search?: string;
  readonly severities?: ReadonlySet<number>;
};

const parseFilterDate = (value: string | undefined): Date | undefined => {
  if (!value) {
    return undefined;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new TypeError('Invalid client logs date filter.');
  }
  return date;
};

const parseLogFilter = (filter: string | undefined): ParsedLogFilter => {
  if (!filter) {
    return {};
  }

  const severityValues = /severity in \[([\d, ]+)\]/u.exec(filter)?.[1];
  const escapedSearch = /search == "((?:\\.|[^"])*)"/u.exec(filter)?.[1];
  const minTimestamp = /message_timestamp >= "([^"]+)"/u.exec(filter)?.[1];
  const maxTimestamp = /message_timestamp <= "([^"]+)"/u.exec(filter)?.[1];

  return {
    ...(severityValues
      ? {
          severities: new Set(
            severityValues.split(',').map((value) => Number.parseInt(value.trim(), 10)),
          ),
        }
      : {}),
    ...(escapedSearch
      ? { search: escapedSearch.replaceAll(/\\(["\\])/gu, '$1').toLowerCase() }
      : {}),
    ...(minTimestamp ? { minTimestamp: parseFilterDate(minTimestamp) } : {}),
    ...(maxTimestamp ? { maxTimestamp: parseFilterDate(maxTimestamp) } : {}),
  };
};

const isWithinDateRange = (log: ApiClientLog, filter: ParsedLogFilter): boolean => {
  if (!log.messageTimestampMs) {
    return false;
  }

  const timestamp = log.messageTimestampMs.getTime();
  const isAtOrAfterMin =
    filter.minTimestamp === undefined || timestamp >= filter.minTimestamp.getTime();
  const isAtOrBeforeMax =
    filter.maxTimestamp === undefined || timestamp <= filter.maxTimestamp.getTime();
  return isAtOrAfterMin && isAtOrBeforeMax;
};

const matchesSeverity = (log: ApiClientLog, filter: ParsedLogFilter): boolean =>
  filter.severities === undefined ||
  (log.severity !== undefined && filter.severities.has(log.severity));

const matchesLogSearchKey = (log: ApiClientLog, filter: ParsedLogFilter): boolean =>
  filter.search === undefined || log.message?.toLowerCase().includes(filter.search) === true;

const getMockClientLogs = (universeId: number, sessionId: string): readonly ApiClientLog[] =>
  Array.from({ length: MOCK_LOG_COUNT }, (_unused, logIndex) => {
    const definition = MOCK_CLIENT_LOG_DEFINITIONS[logIndex % MOCK_CLIENT_LOG_DEFINITIONS.length];
    return {
      messageTimestampMs: new Date(MOCK_LOG_START_TIME_MS - logIndex * MOCK_LOG_INTERVAL_MS),
      universeId,
      placeId: MOCK_PLACE_ID,
      placeVersion: MOCK_PLACE_VERSION,
      sessionId,
      ...definition,
    };
  });

const listMockClientLogs = async (
  {
    universeId,
    sessionId,
    maxPageSize = DEFAULT_PAGE_SIZE,
    pageToken,
    orderBy = DEFAULT_ORDER_BY,
    filter,
  }: ListClientLogsRequest,
  initOverrides?: RequestInit,
): Promise<ListClientLogsResponse> => {
  await waitForMockResponse(initOverrides?.signal);

  if (orderBy !== DEFAULT_ORDER_BY && orderBy !== ASCENDING_ORDER_BY) {
    throw new TypeError('Unsupported client logs order.');
  }
  const offset = getPageOffset(pageToken);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, maxPageSize));
  const parsedFilter = parseLogFilter(filter);
  const filteredClientLogs = getMockClientLogs(universeId, sessionId)
    .filter(
      (log) =>
        isWithinDateRange(log, parsedFilter) &&
        matchesSeverity(log, parsedFilter) &&
        matchesLogSearchKey(log, parsedFilter),
    )
    .sort((firstLog, secondLog) => {
      const firstTimestamp = firstLog.messageTimestampMs?.getTime() ?? 0;
      const secondTimestamp = secondLog.messageTimestampMs?.getTime() ?? 0;
      if (orderBy === DEFAULT_ORDER_BY) {
        return secondTimestamp - firstTimestamp;
      }
      return firstTimestamp - secondTimestamp;
    });
  const clientLogs = filteredClientLogs.slice(offset, offset + pageSize);
  const nextOffset = offset + clientLogs.length;

  return {
    clientLogs,
    nextPageToken:
      nextOffset < filteredClientLogs.length ? getNextPageToken(nextOffset) : undefined,
  };
};

export const mockClientLogsApi: ClientLogsApi = {
  clientSessionsListClientLogs: listMockClientLogs,
};
