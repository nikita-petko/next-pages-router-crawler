import type { CreatorConfigsPublicApiConfigRepositoryValues } from '@modules/clients/creatorConfigsPublicApi';
import {
  CreatorConfigsPublicApiHttpError,
  getConfigRepositoryValues,
  publishDraft,
  updateDraft,
} from '@modules/clients/creatorConfigsPublicApi';
import {
  ACTIVE_LEADERBOARDS_KEY,
  LEADERBOARD_REPOSITORY,
  type LeaderboardConfig,
  type LeaderboardConfigEntry,
  type LeaderboardConfigItem,
} from './types';

const PUBLISH_MESSAGE = 'Updated leaderboard config via Creator Hub';

export const getLeaderboardConfigQueryKey = (universeId: string | number | undefined) =>
  ['leaderboard-config', universeId] as const;

type UnknownRecord = { readonly [key: string]: unknown };

function asRecord(value: unknown): UnknownRecord | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- guarded above; keys are still unknown so consumers must narrow
  return value as UnknownRecord;
}

function isLeaderboardConfigEntry(value: unknown): value is LeaderboardConfigEntry {
  const v = asRecord(value);
  if (!v) {
    return false;
  }
  if (typeof v.leaderboard_name !== 'string') {
    return false;
  }
  if (typeof v.unit !== 'string') {
    return false;
  }
  if (v.scope !== undefined && typeof v.scope !== 'string') {
    return false;
  }
  const ods = asRecord(v.ordered_data_store);
  if (!ods) {
    return false;
  }
  if (typeof ods.name !== 'string') {
    return false;
  }
  if (ods.key_mapping_template !== undefined && typeof ods.key_mapping_template !== 'string') {
    return false;
  }
  return true;
}

// Drops entries that don't match `LeaderboardConfigEntry` so an unrecognized backend shape
// degrades gracefully instead of bricking the page.
export function parseLeaderboardConfig(
  raw: CreatorConfigsPublicApiConfigRepositoryValues,
): LeaderboardConfig {
  const configVersion = raw.metadata?.configVersion ?? 0;
  const entries = raw.entries ?? {};
  const leaderboards: LeaderboardConfigItem[] = [];
  let activeLeaderboardKeys: string[] = [];

  for (const [key, value] of Object.entries(entries)) {
    if (key === ACTIVE_LEADERBOARDS_KEY) {
      if (Array.isArray(value)) {
        activeLeaderboardKeys = value.filter((v): v is string => typeof v === 'string');
      }
    } else if (isLeaderboardConfigEntry(value)) {
      leaderboards.push({ key, config: value });
    }
  }

  return { configVersion, leaderboards, activeLeaderboardKeys };
}

export async function fetchLeaderboardConfig(universeId: string): Promise<LeaderboardConfig> {
  const raw = await getConfigRepositoryValues({
    universeId,
    repository: LEADERBOARD_REPOSITORY,
  });
  return parseLeaderboardConfig(raw);
}

// The server returns 400 EmptyDraft when the draft is byte-identical to the published config;
// treat it as a successful no-op rather than surfacing the error.
function isEmptyDraftError(e: unknown): boolean {
  if (!(e instanceof CreatorConfigsPublicApiHttpError) || e.status !== 400) {
    return false;
  }
  try {
    const parsed: unknown = JSON.parse(e.bodyText);
    const v = asRecord(parsed);
    if (!v) {
      return false;
    }
    const errs = v.validationErrors;
    if (!Array.isArray(errs)) {
      return false;
    }
    return errs.some((entry) => {
      const obj = asRecord(entry);
      return obj?.code === 'EmptyDraft';
    });
  } catch {
    return false;
  }
}

async function saveLeaderboardEntries(
  universeId: string,
  entries: Record<string, unknown>,
): Promise<void> {
  const opts = { universeId, repository: LEADERBOARD_REPOSITORY };

  const { draftHash } = await updateDraft(opts, { entries });
  if (!draftHash) {
    throw new Error('Missing draftHash from updateDraft response');
  }

  try {
    await publishDraft(opts, {
      draftHash,
      message: PUBLISH_MESSAGE,
      deploymentStrategy: 'Immediate',
    });
  } catch (e: unknown) {
    if (isEmptyDraftError(e)) {
      return;
    }
    throw e;
  }
}

export async function addOrUpdateLeaderboardConfig(
  universeId: string,
  key: string,
  entry: LeaderboardConfigEntry,
): Promise<void> {
  await saveLeaderboardEntries(universeId, { [key]: entry });
}

// Returns the next active list only when it must change (avoids churning the published config).
function computeNextActiveKeys(
  currentActiveKeys: readonly string[],
  key: string,
  isActive: boolean,
): readonly string[] | undefined {
  if (isActive) {
    if (currentActiveKeys.length === 1 && currentActiveKeys[0] === key) {
      return undefined;
    }
    return [key];
  }
  if (currentActiveKeys.includes(key)) {
    return currentActiveKeys.filter((k) => k !== key);
  }
  return undefined;
}

// Atomic write: bundles entry + active-list (when it changes) into one updateDraft+publishDraft.
export async function saveLeaderboardConfig(args: {
  universeId: string;
  key: string;
  entry: LeaderboardConfigEntry;
  isActive: boolean;
  currentActiveKeys: readonly string[];
}): Promise<void> {
  const entries: Record<string, unknown> = { [args.key]: args.entry };
  const nextActive = computeNextActiveKeys(args.currentActiveKeys, args.key, args.isActive);
  if (nextActive !== undefined) {
    entries[ACTIVE_LEADERBOARDS_KEY] = nextActive;
  }
  await saveLeaderboardEntries(args.universeId, entries);
}

export async function setActiveLeaderboards(
  universeId: string,
  activeKeys: readonly string[],
): Promise<void> {
  await saveLeaderboardEntries(universeId, { [ACTIVE_LEADERBOARDS_KEY]: activeKeys });
}

// No DELETE /entries/{key} endpoint exists for this repository — we delete via PATCH null.
export async function deleteLeaderboardConfig(
  universeId: string,
  key: string,
  currentActiveKeys: readonly string[],
): Promise<void> {
  const entries: Record<string, unknown> = { [key]: null };

  const newActiveKeys = currentActiveKeys.filter((k) => k !== key);
  if (newActiveKeys.length !== currentActiveKeys.length) {
    entries[ACTIVE_LEADERBOARDS_KEY] = newActiveKeys;
  }

  await saveLeaderboardEntries(universeId, entries);
}
