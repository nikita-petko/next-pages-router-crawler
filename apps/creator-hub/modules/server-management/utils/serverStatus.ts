import type { ServerStatus } from '../types/GameServerControls';

const SERVER_STATUSES = [
  {
    key: 'active',
    api: 'active',
    translation: 'ServerStatus.Active',
    description: 'ServerStatus.Description.Active',
    indicator: 'bg-system-success',
  },
  {
    key: 'shutDown',
    api: 'shut_down',
    translation: 'ServerStatus.ShutDown',
    description: 'ServerStatus.Description.ShutDown',
    indicator: 'bg-system-neutral',
  },
  {
    key: 'crashed',
    api: 'crashed',
    translation: 'ServerStatus.Crashed',
    description: 'ServerStatus.Description.Crashed',
    indicator: 'bg-system-alert',
  },
  {
    key: 'outOfMemory',
    api: 'out_of_memory',
    translation: 'ServerStatus.OutOfMemory',
    description: 'ServerStatus.Description.OutOfMemory',
    indicator: 'bg-system-alert',
  },
  {
    key: 'restarted',
    api: 'restarted',
    translation: 'ServerStatus.Restarted',
    description: 'ServerStatus.Description.Restarted',
    indicator: 'bg-system-neutral',
  },
  {
    key: 'robloxRestarted',
    api: 'roblox_restarted',
    translation: 'ServerStatus.RobloxRestarted',
    description: 'ServerStatus.Description.RobloxRestarted',
    indicator: 'bg-system-neutral',
  },
  {
    key: 'moderated',
    api: 'moderated',
    translation: 'ServerStatus.Moderated',
    description: 'ServerStatus.Description.Moderated',
    indicator: 'bg-system-neutral',
  },
] as const satisfies readonly {
  key: keyof ServerStatus;
  api: string;
  translation: string;
  description: string;
  indicator: string;
}[];

export type ServerStatusFilterKey = (typeof SERVER_STATUSES)[number]['key'];

export const SERVER_STATUS_FILTER_KEYS: readonly ServerStatusFilterKey[] = SERVER_STATUSES.map(
  (status) => status.key,
);

function isCompleteStatusRecord<T>(
  value: Partial<Record<ServerStatusFilterKey, T>>,
): value is Record<ServerStatusFilterKey, T> {
  return SERVER_STATUS_FILTER_KEYS.every((key) => value[key] !== undefined);
}

function statusRecord<T>(
  getValue: (status: (typeof SERVER_STATUSES)[number]) => T,
): Record<ServerStatusFilterKey, T> {
  const result: Partial<Record<ServerStatusFilterKey, T>> = {};
  for (const status of SERVER_STATUSES) {
    result[status.key] = getValue(status);
  }
  if (!isCompleteStatusRecord(result)) {
    throw new Error('Incomplete server status record');
  }
  return result;
}

export const SERVER_STATUS_KEYS = statusRecord((status) => status.translation);
export const SERVER_STATUS_DESCRIPTIONS = statusRecord((status) => status.description);
export const SERVER_STATUS_QUERY_FIELDS = statusRecord((status) => `server_status.${status.api}`);
export const DEFAULT_SERVER_STATUS_FILTER = statusRecord(() => true);
export const NONE_SELECTED_SERVER_STATUS_FILTER = statusRecord(() => false);
export const ACTIVE_ONLY_SERVER_STATUS_FILTER = statusRecord((status) => status.key === 'active');

const STATUS_BY_API = Object.fromEntries(
  SERVER_STATUSES.map((status) => [status.api, status.translation]),
);

const INDICATOR_BY_TRANSLATION = Object.fromEntries(
  SERVER_STATUSES.map((status) => [status.translation, status.indicator]),
);

const DESCRIPTION_BY_TRANSLATION = Object.fromEntries(
  SERVER_STATUSES.map((status) => [status.translation, status.description]),
);

export function getStatusIndicatorClass(status: string): string {
  return INDICATOR_BY_TRANSLATION[status] ?? 'bg-system-neutral';
}

export function getStatusDescriptionKey(status: string): string | undefined {
  return DESCRIPTION_BY_TRANSLATION[status];
}

export function resolveServerStatus(status?: string): string {
  if (!status) {
    return SERVER_STATUS_KEYS.active;
  }
  return STATUS_BY_API[status] ?? SERVER_STATUS_KEYS.active;
}

export function parseServerStatusFromUrl(serverStatusRaw: string | undefined): ServerStatus {
  if (!serverStatusRaw) {
    return { ...ACTIVE_ONLY_SERVER_STATUS_FILTER };
  }

  const tokens = new Set(serverStatusRaw.split(','));
  if (tokens.has('shutdown') || tokens.has('terminated')) {
    return { ...DEFAULT_SERVER_STATUS_FILTER, active: false };
  }

  return statusRecord((entry) => tokens.has(entry.key));
}

export function areAllServerStatusesSelected(status: ServerStatus): boolean {
  return SERVER_STATUS_FILTER_KEYS.every((key) => status[key]);
}

export function isActiveOnlyServerStatus(status: ServerStatus): boolean {
  return SERVER_STATUS_FILTER_KEYS.every((key) => status[key] === (key === 'active'));
}

export function areNoServerStatusesSelected(status: ServerStatus): boolean {
  return SERVER_STATUS_FILTER_KEYS.every((key) => !status[key]);
}
