import {
  CustomDashboardNotAvailableError,
  CustomDashboardNotFoundError,
  CustomDashboardQuotaExceededError,
  CustomDashboardStorageUnreadableError,
  CustomDashboardStorageWriteError,
  CustomDashboardUnsupportedSchemaError,
  CustomDashboardVersionConflictError,
} from '../errors';
import {
  getChartRows,
  getSummaryCards,
  withChartRows,
  withSummaryCards,
} from '../layout/dashboardLayout';
import { applyMigrations } from '../migrations';
import {
  type AddChartTileInput,
  type AddChartTileResult,
  CUSTOM_DASHBOARD_CURRENT_SCHEMA_VERSION,
  type CreateCustomDashboardInput,
  type CustomDashboardDocument,
  type CustomDashboardListOptions,
  type CustomDashboardListResult,
  type CustomDashboardMutationOptions,
  EMPTY_DASHBOARD_CONFIG,
  MAX_DASHBOARDS_PER_UNIVERSE,
  type UpdateCustomDashboardInput,
} from '../types';
import { addChartTileToConfig } from '../utils/addChartTileToConfig';
import { type Clock, systemClock } from '../utils/clock';
import { cloneTileWithNewId } from '../utils/cloneTile';
import { defaultIdFactory, type IdFactory } from '../utils/createTileId';
import {
  type DuplicateDashboardNameSuffixes,
  testOnlyEnglishDuplicateDashboardNameSuffixes,
} from '../utils/duplicateDashboardNameSuffixes';
import { sortDashboardsForList } from '../utils/sortDashboards';
import { buildDuplicateDashboardName, suggestDefaultName } from '../utils/suggestDefaultName';
import {
  isRecord,
  validateCustomDashboardConfig,
  validateCustomDashboardDocument,
  validateDashboardDescription,
  validateDashboardName,
} from '../utils/validators';
import type {
  CustomDashboardService,
  CustomDashboardServiceChangeEvent,
} from './CustomDashboardService';
import { pageLocalItems } from './pageLocalItems';

/**
 * localStorage-backed v1 implementation. Cross-tab sync via the DOM `storage`
 * event. Reads run the migration pipeline and rewrite storage if any document
 * changed version; writes bump a per-document `version` and re-read the bucket
 * before committing to close the last-writer-wins window.
 *
 * Records that fail migration are kept in a quarantine bucket keyed alongside
 * live records so support can recover the original JSON.
 */

type PersistedLiveRecord = {
  readonly document: unknown;
  readonly version: number;
};

type PersistedQuarantineRecord = {
  readonly version: number;
  readonly migrationFailed: true;
  readonly reason: string;
  readonly raw: unknown;
};

type PersistedRecord = PersistedLiveRecord | PersistedQuarantineRecord;

type RawStorageBucket = {
  readonly records: Record<string, unknown>;
};

type StorageBucket = {
  readonly records: Record<string, PersistedRecord>;
};

const STORAGE_KEY_PREFIX = 'creator-hub:custom-dashboards:v1:universe:';
const SIDECAR_KEY_PREFIX = 'creator-hub:custom-dashboards:v1:unreadable:universe:';

// Universe ids are positive integers; use a strict regex so cross-tab events
// for unrelated keys (e.g. another extension writing
// `…:universe:100something`) don't slip past with `Number.parseInt`.
const UNIVERSE_ID_PATTERN = /^\d+$/;

function storageKey(universeId: number): string {
  return `${STORAGE_KEY_PREFIX}${universeId}`;
}

function sidecarKey(universeId: number): string {
  // Deterministic per universe — a `Date.now()` suffix would accumulate one
  // sidecar entry per failed parse, eating quota over time.
  return `${SIDECAR_KEY_PREFIX}${universeId}`;
}

function parseUniverseIdFromStorageKey(key: string): number | null {
  if (!key.startsWith(STORAGE_KEY_PREFIX)) {
    return null;
  }
  const remainder = key.slice(STORAGE_KEY_PREFIX.length);
  if (!UNIVERSE_ID_PATTERN.test(remainder)) {
    return null;
  }
  const parsed = Number(remainder);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function isQuarantineRecord(record: unknown): record is PersistedQuarantineRecord {
  return isRecord(record) && record.migrationFailed === true;
}

function isPersistedLiveRecord(record: unknown): record is PersistedLiveRecord {
  return isRecord(record) && typeof record.version === 'number' && 'document' in record;
}

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function getStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return window.localStorage ?? null;
  } catch {
    return null;
  }
}

// Browser-agnostic quota check — Safari, Firefox, and Chrome each use a
// different signal.
/** DOMException legacy `code` for QUOTA_EXCEEDED (older browsers). */
const DOMEXCEPTION_QUOTA_EXCEEDED_LEGACY_CODE = 22;

function isQuotaError(cause: unknown): boolean {
  if (!isRecord(cause)) {
    return false;
  }
  const code = cause.code;
  const name = cause.name;
  return (
    code === DOMEXCEPTION_QUOTA_EXCEEDED_LEGACY_CODE ||
    name === 'QuotaExceededError' ||
    name === 'NS_ERROR_DOM_QUOTA_REACHED'
  );
}

type ReadBucketResult =
  | { ok: true; bucket: RawStorageBucket }
  | { ok: false; unreadableSidecarKey: string };

/**
 * Preserve the raw bytes to the sidecar key and signal "unreadable". Used for
 * both hard `JSON.parse` failures and valid-JSON-but-wrong-shape buckets so a
 * corrupted or hand-edited bucket is never silently dropped.
 */
function sidecarUnreadableBucket(
  storage: Storage,
  universeId: number,
  raw: string,
): ReadBucketResult {
  const key = sidecarKey(universeId);
  try {
    storage.setItem(key, raw);
  } catch {
    // Quota during sidecar write — original bytes remain at their key.
  }
  return { ok: false, unreadableSidecarKey: key };
}

function readBucket(storage: Storage, universeId: number, raw: string | null): ReadBucketResult {
  if (!raw) {
    return { ok: true, bucket: { records: {} } };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Hard parse failure — sidecar the raw bytes so support can recover.
    return sidecarUnreadableBucket(storage, universeId, raw);
  }
  // Valid JSON but the wrong top-level shape (`[]`, `null`, a string, or a
  // missing/non-object `records`) is just as unreadable as a parse failure.
  // Returning an empty universe here would silently hide the user's saved
  // dashboards while leaving the bad bytes in place forever, so treat it the
  // same as hard corruption: preserve the bytes and surface the signal.
  if (!isRecord(parsed) || !isRecord(parsed.records)) {
    return sidecarUnreadableBucket(storage, universeId, raw);
  }
  return { ok: true, bucket: { records: parsed.records } };
}

function writeBucket(storage: Storage, universeId: number, bucket: StorageBucket): void {
  try {
    storage.setItem(storageKey(universeId), JSON.stringify(bucket));
  } catch (cause) {
    if (isQuotaError(cause)) {
      throw new CustomDashboardQuotaExceededError();
    }
    if (cause instanceof CustomDashboardStorageWriteError) {
      throw cause;
    }
    // Safari private mode, security errors, unknown DOM exceptions — wrap so
    // callers can branch on a stable typed error rather than the raw cause.
    throw new CustomDashboardStorageWriteError(cause);
  }
}

/**
 * Run migrations + validation across every persisted record. Records that
 * fail are quarantined so rendering never crashes; the UI surfaces a toast.
 *
 * Records are re-keyed by `document.id` after validation. If the bucket key
 * disagrees with the document id (corrupted disk, hand-edited JSON), the
 * record is quarantined under the bucket key rather than silently indexed
 * inconsistently with the in-memory backend.
 */
function materialiseBucket(
  universeId: number,
  bucket: RawStorageBucket,
): {
  readonly records: Record<string, { document: CustomDashboardDocument; version: number }>;
  readonly quarantine: Record<string, PersistedQuarantineRecord>;
  readonly corrupted: ReadonlyArray<{ id: string; reason: string; code: 'NEWER' | 'OTHER' }>;
  readonly mutatedOnRead: boolean;
} {
  const out: Record<string, { document: CustomDashboardDocument; version: number }> = {};
  const quarantine: Record<string, PersistedQuarantineRecord> = {};
  const corrupted: { id: string; reason: string; code: 'NEWER' | 'OTHER' }[] = [];
  let mutatedOnRead = false;

  Object.entries(bucket.records ?? {}).forEach(([key, raw]) => {
    if (!raw || typeof raw !== 'object') {
      quarantine[key] = {
        version: 1,
        migrationFailed: true,
        reason: 'record was not an object',
        raw,
      };
      corrupted.push({ id: key, reason: 'record was not an object', code: 'OTHER' });
      return;
    }
    if (isQuarantineRecord(raw)) {
      quarantine[key] = raw;
      corrupted.push({ id: key, reason: raw.reason, code: 'OTHER' });
      return;
    }
    if (!isPersistedLiveRecord(raw)) {
      quarantine[key] = {
        version: 1,
        migrationFailed: true,
        reason: 'record was not a live persisted record',
        raw,
      };
      corrupted.push({ id: key, reason: 'record was not a live persisted record', code: 'OTHER' });
      return;
    }
    const { document, version } = raw;
    const documentRecord = isRecord(document) ? document : {};
    const priorSchemaVersion =
      typeof documentRecord.schemaVersion === 'number' ? documentRecord.schemaVersion : undefined;
    try {
      const migrated = applyMigrations({
        schemaVersion: priorSchemaVersion,
        ...documentRecord,
      });
      if (priorSchemaVersion !== migrated.schemaVersion) {
        mutatedOnRead = true;
      }
      const validated = validateCustomDashboardDocument({
        ...migrated,
        universeId,
      });
      if (validated.id !== key) {
        const reason = `bucket key "${key}" does not match document.id "${validated.id}"`;
        quarantine[key] = {
          version: typeof version === 'number' ? version : 1,
          migrationFailed: true,
          reason,
          raw: document,
        };
        corrupted.push({ id: key, reason, code: 'OTHER' });
        mutatedOnRead = true;
        return;
      }
      out[validated.id] = {
        document: validated,
        version: typeof version === 'number' ? version : 1,
      };
    } catch (err) {
      const isNewer = err instanceof CustomDashboardUnsupportedSchemaError;
      const reason = getErrorMessage(err);
      quarantine[key] = {
        version: typeof version === 'number' ? version : 1,
        migrationFailed: true,
        reason,
        raw: document,
      };
      corrupted.push({ id: key, reason, code: isNewer ? 'NEWER' : 'OTHER' });
      mutatedOnRead = true;
    }
  });
  return { records: out, quarantine, corrupted, mutatedOnRead };
}

// Quarantine never goes away on a read/write cycle — only an explicit user
// action drops it. Protects records from being silently dropped when a
// migration step is missing locally.
function persistMaterialised(
  storage: Storage,
  universeId: number,
  records: Record<string, { document: CustomDashboardDocument; version: number }>,
  quarantine: Record<string, PersistedQuarantineRecord>,
): void {
  const merged: Record<string, PersistedRecord> = {};
  Object.entries(records).forEach(([id, r]) => {
    merged[id] = { document: r.document, version: r.version };
  });
  Object.entries(quarantine).forEach(([id, r]) => {
    if (!(id in merged)) {
      merged[id] = r;
    }
  });
  writeBucket(storage, universeId, { records: merged });
}

/**
 * Throw if `records` is already at the per-universe cap. Called inside the
 * `commit` closure (against the freshly re-read snapshot) so the check and the
 * write share one snapshot — a pre-commit check on a separate read could let
 * two concurrent tabs both pass and exceed the cap.
 */
function assertRecordsUnderUniverseCap(
  universeId: number,
  records: Record<string, { document: CustomDashboardDocument; version: number }>,
): void {
  if (Object.keys(records).length >= MAX_DASHBOARDS_PER_UNIVERSE) {
    throw new CustomDashboardQuotaExceededError(
      `Universe ${universeId} is at the per-universe cap of ${MAX_DASHBOARDS_PER_UNIVERSE} dashboards. Delete one to create another.`,
    );
  }
}

export type LocalStorageCustomDashboardServiceOptions = {
  readonly clock?: Clock;
  readonly idFactory?: IdFactory;
  readonly duplicateNameSuffixes?: DuplicateDashboardNameSuffixes;
  /** Fires when implicit post-migration rewrite fails; non-fatal. */
  readonly onPersistError?: (error: unknown) => void;
};

type MaterialisedSnapshot = {
  readonly rawString: string | null;
  readonly records: Record<string, { document: CustomDashboardDocument; version: number }>;
  readonly quarantine: Record<string, PersistedQuarantineRecord>;
};

class LocalStorageCustomDashboardService implements CustomDashboardService {
  private readonly listeners = new Set<(event: CustomDashboardServiceChangeEvent) => void>();

  private storageListenerAttached = false;

  private disposed = false;

  private readonly corruptedByUniverse = new Map<
    number,
    ReadonlyArray<{ id: string; reason: string; code: 'NEWER' | 'OTHER' }>
  >();

  private readonly storageUnreadableByUniverse = new Map<number, string>();

  /**
   * Cache the materialised view of each universe keyed by the raw storage
   * string. A read can compare `getItem(...)` to the cached `rawString` and
   * skip `JSON.parse` + per-record validation when nothing has changed.
   * Cleared on writes (we re-read after write) and on cross-tab events.
   */
  private readonly materialisedByUniverse = new Map<number, MaterialisedSnapshot>();

  private readonly clock: Clock;

  private readonly idFactory: IdFactory;

  private readonly onPersistError: ((error: unknown) => void) | undefined;

  private readonly duplicateNameSuffixes: DuplicateDashboardNameSuffixes;

  constructor(options: LocalStorageCustomDashboardServiceOptions = {}) {
    this.clock = options.clock ?? systemClock;
    this.onPersistError = options.onPersistError;
    // Tests inject `createDeterministicIdFactory()` via `options.idFactory`
    // for reproducible ids. Production uses `defaultIdFactory` which calls
    // `crypto.randomUUID()` directly — no clock plumbing through ids.
    this.idFactory = options.idFactory ?? defaultIdFactory;
    this.duplicateNameSuffixes =
      options.duplicateNameSuffixes ?? testOnlyEnglishDuplicateDashboardNameSuffixes;
  }

  /** Records that failed migration on the most recent read. */
  getCorruptedRecordsForUniverse(
    universeId: number,
  ): ReadonlyArray<{ id: string; reason: string; code: 'NEWER' | 'OTHER' }> {
    return this.corruptedByUniverse.get(universeId) ?? [];
  }

  /** Sidecar key when the entire bucket failed to parse; `null` otherwise. */
  getStorageUnreadableSidecarKey(universeId: number): string | null {
    return this.storageUnreadableByUniverse.get(universeId) ?? null;
  }

  /**
   * Idempotent — safe to call from effect cleanup. After dispose, the
   * instance refuses further work: subscribe is a no-op, and any storage
   * access throws `CustomDashboardNotAvailableError`. This prevents a stale
   * reference from re-attaching the storage listener post-cleanup.
   */
  dispose(): void {
    if (this.storageListenerAttached && typeof window !== 'undefined') {
      window.removeEventListener('storage', this.handleStorageEvent);
    }
    this.storageListenerAttached = false;
    this.listeners.clear();
    this.materialisedByUniverse.clear();
    this.disposed = true;
  }

  private ensureStorageListener(): void {
    if (this.disposed || this.storageListenerAttached || typeof window === 'undefined') {
      return;
    }
    window.addEventListener('storage', this.handleStorageEvent);
    this.storageListenerAttached = true;
  }

  private handleStorageEvent = (event: StorageEvent): void => {
    if (!event.key) {
      return;
    }
    const universeId = parseUniverseIdFromStorageKey(event.key);
    if (universeId === null) {
      return;
    }
    // Drop the cache for this universe so the next read re-parses fresh disk.
    this.materialisedByUniverse.delete(universeId);
    this.emit({ universeId, eventType: 'external' });
  };

  private requireStorage(): Storage {
    if (this.disposed) {
      throw new CustomDashboardNotAvailableError();
    }
    const storage = getStorage();
    if (!storage) {
      throw new CustomDashboardNotAvailableError();
    }
    this.ensureStorageListener();
    return storage;
  }

  private emit(event: CustomDashboardServiceChangeEvent): void {
    Array.from(this.listeners).forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        // Listener errors never poison the mutation — see CustomDashboardService.subscribe
        // docs. Log a console.warn so a misbehaving subscriber doesn't fail
        // silently in dev; production builds keep the same swallow semantics.
        console.warn('[CustomDashboardService] listener threw; ignoring.', error);
      }
    });
  }

  /**
   * Refuse to write past the per-universe cap. Mirrors the InMemory backend
   * so the cap is enforced regardless of which implementation is wired in;
   * the conformance suite asserts both behave the same.
   */
  private assertUnderUniverseCap(universeId: number): void {
    const { records } = this.readMaterialised(universeId, 'swallowUnreadable');
    assertRecordsUnderUniverseCap(universeId, records);
  }

  private readMaterialised(
    universeId: number,
    readMode: 'throwOnUnreadable' | 'swallowUnreadable' = 'throwOnUnreadable',
  ): {
    storage: Storage;
    records: Record<string, { document: CustomDashboardDocument; version: number }>;
    quarantine: Record<string, PersistedQuarantineRecord>;
  } {
    const storage = this.requireStorage();
    const rawString = storage.getItem(storageKey(universeId));

    // Cache hit: nothing has changed on disk since the last materialisation.
    // The cache is invalidated on writes and cross-tab events, so a hit means
    // no peer has touched the bucket.
    const cached = this.materialisedByUniverse.get(universeId);
    if (cached && cached.rawString === rawString) {
      return { storage, records: cached.records, quarantine: cached.quarantine };
    }

    const result = readBucket(storage, universeId, rawString);
    if (!result.ok) {
      this.storageUnreadableByUniverse.set(universeId, result.unreadableSidecarKey);
      if (readMode === 'throwOnUnreadable') {
        throw new CustomDashboardStorageUnreadableError(result.unreadableSidecarKey);
      }
      // Swallow: treat as empty going forward; the next list() surfaces the
      // banner. Don't lie about quarantine state — leave any prior corrupted/
      // quarantine entries intact so a follow-up `list()` reports them.
      const empty: Record<string, { document: CustomDashboardDocument; version: number }> = {};
      // Don't cache: rawString is unparseable so `materialisedByUniverse`
      // would key against the same broken bytes and skip the next attempt.
      return { storage, records: empty, quarantine: {} };
    }
    this.storageUnreadableByUniverse.delete(universeId);
    const { records, quarantine, corrupted, mutatedOnRead } = materialiseBucket(
      universeId,
      result.bucket,
    );
    this.corruptedByUniverse.set(universeId, corrupted);
    if (mutatedOnRead) {
      try {
        persistMaterialised(storage, universeId, records, quarantine);
        // After a successful rewrite, the rawString cache key is stale —
        // re-read so the cache reflects what we actually wrote.
        const newRaw = storage.getItem(storageKey(universeId));
        this.materialisedByUniverse.set(universeId, {
          rawString: newRaw,
          records,
          quarantine,
        });
      } catch (error) {
        this.onPersistError?.(error);
        // Don't cache: persist failed, so next read should retry the rewrite.
      }
    } else {
      this.materialisedByUniverse.set(universeId, { rawString, records, quarantine });
    }
    return { storage, records, quarantine };
  }

  async list(
    universeId: number,
    options?: CustomDashboardListOptions,
  ): Promise<CustomDashboardListResult> {
    const { records } = this.readMaterialised(universeId);
    const allItems = sortDashboardsForList(Object.values(records).map((r) => r.document));
    const migrationFailedCount = this.corruptedByUniverse.get(universeId)?.length ?? 0;
    return { ...pageLocalItems(allItems, options), migrationFailedCount };
  }

  async get(universeId: number, dashboardId: string): Promise<CustomDashboardDocument> {
    const { records } = this.readMaterialised(universeId);
    const record = records[dashboardId];
    if (!record) {
      throw new CustomDashboardNotFoundError(dashboardId);
    }
    return record.document;
  }

  async getVersion(universeId: number, dashboardId: string): Promise<number | null> {
    const { records } = this.readMaterialised(universeId);
    return records[dashboardId]?.version ?? null;
  }

  /** Re-reads the bucket immediately before committing so a concurrent writer can't clobber us. */
  private commit<T>(
    universeId: number,
    mutate: (
      records: Record<string, { document: CustomDashboardDocument; version: number }>,
      quarantine: Record<string, PersistedQuarantineRecord>,
    ) => {
      next: Record<string, { document: CustomDashboardDocument; version: number }>;
      result: T;
    },
  ): T {
    const { storage, records, quarantine } = this.readMaterialised(universeId);
    const { next, result } = mutate(records, quarantine);
    persistMaterialised(storage, universeId, next, quarantine);
    // Refresh the cache to point at the bytes we just wrote so subsequent
    // same-tab reads can hit the cache without re-parsing.
    const newRaw = storage.getItem(storageKey(universeId));
    this.materialisedByUniverse.set(universeId, {
      rawString: newRaw,
      records: next,
      quarantine,
    });
    return result;
  }

  /** Build + persist a new record. Shared by `create` and `createAndPublish`. */
  private insertNewDocument(
    input: CreateCustomDashboardInput,
    status: 'draft' | 'published',
  ): CustomDashboardDocument {
    this.assertUnderUniverseCap(input.universeId);
    const name = validateDashboardName(input.name);
    const description = validateDashboardDescription(input.description);
    // Substitute the empty config at the service boundary before validation —
    // the validator strictly requires `config` so silent coercion can't mask
    // real corruption. Mirrors the InMemory backend.
    const config =
      input.config !== undefined
        ? validateCustomDashboardConfig(input.config)
        : EMPTY_DASHBOARD_CONFIG;
    const now = this.clock.isoNow();
    const document: CustomDashboardDocument = {
      id: this.idFactory.nextDashboardId(),
      schemaVersion: CUSTOM_DASHBOARD_CURRENT_SCHEMA_VERSION,
      universeId: input.universeId,
      name,
      description,
      status,
      isPinned: false,
      createdAt: now,
      updatedAt: now,
      ...(status === 'published' ? { publishedAt: now } : {}),
      createdByUserId: input.createdByUserId,
      createdByUsername: input.createdByUsername,
      updatedByUserId: input.createdByUserId,
      updatedByUsername: input.createdByUsername,
      config,
    };
    this.commit(input.universeId, (records) => {
      // Re-check the cap against the just-read snapshot so two concurrent tabs
      // can't both pass the pre-check above and exceed the cap.
      assertRecordsUnderUniverseCap(input.universeId, records);
      const next = { ...records, [document.id]: { document, version: 1 } };
      return { next, result: undefined };
    });
    this.emit({ universeId: input.universeId, dashboardId: document.id, eventType: 'create' });
    return document;
  }

  async create(input: CreateCustomDashboardInput): Promise<CustomDashboardDocument> {
    return this.insertNewDocument(input, 'draft');
  }

  async createAndPublish(input: CreateCustomDashboardInput): Promise<CustomDashboardDocument> {
    return this.insertNewDocument(input, 'published');
  }

  async update(
    universeId: number,
    dashboardId: string,
    changes: UpdateCustomDashboardInput,
    options?: CustomDashboardMutationOptions,
  ): Promise<CustomDashboardDocument> {
    // Validate up-front and collect into a single `validatedChanges` object
    // so the commit closure has one shape to spread rather than three
    // present/absent ternaries; a thrown ValidationError can't leave a
    // half-updated document because the spread happens after every field
    // has been validated.
    const validatedChanges: {
      name?: string;
      description?: string;
      config?: CustomDashboardDocument['config'];
    } = {};
    if (changes.name !== undefined) {
      validatedChanges.name = validateDashboardName(changes.name);
    }
    if (changes.description !== undefined) {
      validatedChanges.description = validateDashboardDescription(changes.description);
    }
    if (changes.config !== undefined) {
      validatedChanges.config = validateCustomDashboardConfig(changes.config);
    }

    return this.applyMutation(
      universeId,
      dashboardId,
      'update',
      () => ({
        ...validatedChanges,
        ...(options?.actor
          ? {
              updatedByUserId: options.actor.userId,
              updatedByUsername: options.actor.username,
            }
          : {}),
      }),
      { expectedVersion: options?.expectedVersion },
    );
  }

  async addChartTile(
    universeId: number,
    dashboardId: string,
    input: AddChartTileInput,
    options?: CustomDashboardMutationOptions,
  ): Promise<AddChartTileResult> {
    const result = this.commit(universeId, (records) => {
      const record = records[dashboardId];
      if (!record) {
        throw new CustomDashboardNotFoundError(dashboardId);
      }
      if (options?.expectedVersion !== undefined && options.expectedVersion !== record.version) {
        throw new CustomDashboardVersionConflictError(dashboardId);
      }
      const { config, tile } = addChartTileToConfig({
        config: record.document.config,
        tile: input.tile,
        nextTileId: this.idFactory.nextTileId(),
      });
      const now = this.clock.isoNow();
      const document: CustomDashboardDocument = {
        ...record.document,
        config,
        updatedAt: now,
        ...(options?.actor
          ? {
              updatedByUserId: options.actor.userId,
              updatedByUsername: options.actor.username,
            }
          : {}),
      };
      const next = {
        ...records,
        [dashboardId]: { document, version: record.version + 1 },
      };
      return { next, result: { document, tile } };
    });
    this.emit({ universeId, dashboardId, eventType: 'add-chart-tile' });
    return result;
  }

  async delete(universeId: number, dashboardId: string): Promise<void> {
    this.commit(universeId, (records) => {
      if (!records[dashboardId]) {
        throw new CustomDashboardNotFoundError(dashboardId);
      }
      const next = { ...records };
      delete next[dashboardId];
      return { next, result: undefined };
    });
    this.emit({ universeId, dashboardId, eventType: 'delete' });
  }

  async duplicate(
    universeId: number,
    dashboardId: string,
    options: { createdByUserId: number; createdByUsername: string },
  ): Promise<CustomDashboardDocument> {
    this.assertUnderUniverseCap(universeId);
    const duplicated = this.commit(universeId, (records) => {
      const source = records[dashboardId]?.document;
      if (!source) {
        throw new CustomDashboardNotFoundError(dashboardId);
      }
      // Re-check the cap against the just-read snapshot (see create).
      assertRecordsUnderUniverseCap(universeId, records);
      const existingNames = Object.values(records).map((r) => r.document.name);
      const candidate = buildDuplicateDashboardName(
        existingNames,
        source.name,
        this.duplicateNameSuffixes,
      );
      const now = this.clock.isoNow();
      const nextTileId = (): string => this.idFactory.nextTileId();
      const duplicatedSummaryCards = getSummaryCards(source.config).map((t) =>
        cloneTileWithNewId(t, nextTileId),
      );
      const duplicatedChartRows = getChartRows(source.config).map((row) => ({
        ...row,
        tiles: row.tiles.map((t) => cloneTileWithNewId(t, nextTileId)),
      }));
      const document: CustomDashboardDocument = {
        ...source,
        id: this.idFactory.nextDashboardId(),
        name: candidate,
        status: 'draft',
        isPinned: false,
        pinnedAt: undefined,
        publishedAt: undefined,
        createdAt: now,
        updatedAt: now,
        createdByUserId: options.createdByUserId,
        createdByUsername: options.createdByUsername,
        updatedByUserId: options.createdByUserId,
        updatedByUsername: options.createdByUsername,
        config: withChartRows(
          withSummaryCards(source.config, duplicatedSummaryCards),
          duplicatedChartRows,
        ),
      };
      const next = { ...records, [document.id]: { document, version: 1 } };
      return { next, result: document };
    });
    this.emit({ universeId, dashboardId: duplicated.id, eventType: 'duplicate' });
    return duplicated;
  }

  async publish(
    universeId: number,
    dashboardId: string,
    options?: { expectedVersion?: number },
  ): Promise<CustomDashboardDocument> {
    return this.applyMutation(
      universeId,
      dashboardId,
      'publish',
      (now) => ({
        status: 'published',
        publishedAt: now,
      }),
      options,
    );
  }

  async unpublish(universeId: number, dashboardId: string): Promise<CustomDashboardDocument> {
    // publishedAt is intentionally preserved as a "last-published" historical
    // signal — re-publish overwrites it, unpublish leaves it alone.
    return this.applyMutation(universeId, dashboardId, 'unpublish', () => ({ status: 'draft' }));
  }

  async pin(universeId: number, dashboardId: string): Promise<CustomDashboardDocument> {
    return this.applyMutation(universeId, dashboardId, 'pin', (now) => ({
      isPinned: true,
      pinnedAt: now,
    }));
  }

  async unpin(universeId: number, dashboardId: string): Promise<CustomDashboardDocument> {
    return this.applyMutation(universeId, dashboardId, 'unpin', () => ({
      isPinned: false,
      pinnedAt: undefined,
    }));
  }

  async suggestDefaultName(universeId: number): Promise<string> {
    // Honour the interface contract — `suggestDefaultName` throws `NotAvailable`
    // when there's no localStorage rather than silently lying with `Dashboard
    // #1`. The next mutation would have thrown the same error anyway; the
    // earlier failure surfaces in the form input rather than after submit.
    // Storage-unreadable is swallowed (treated as empty) because the caller
    // is asking for a default name, not a list — `list()` is the surface
    // that surfaces the unreadable banner.
    const { records } = this.readMaterialised(universeId, 'swallowUnreadable');
    return suggestDefaultName(Object.values(records).map((r) => r.document.name));
  }

  subscribe(listener: (event: CustomDashboardServiceChangeEvent) => void): () => void {
    if (this.disposed) {
      // Refuse to wake up after dispose so a stale reference can't re-attach
      // the storage listener. Returning a no-op unsubscribe keeps callers safe.
      return () => undefined;
    }
    this.ensureStorageListener();
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Apply a single-record mutation: load-or-throw, run the caller's `mutate`
   * to produce the field overrides, stamp `updatedAt`, persist, emit. Mirrors
   * the InMemory backend's `applyMutation` so publish/unpublish/pin/unpin
   * have one shape across both backends — the conformance suite asserts both
   * implementations behave the same.
   */
  private async applyMutation(
    universeId: number,
    dashboardId: string,
    eventType: 'update' | 'publish' | 'unpublish' | 'pin' | 'unpin',
    mutate: (now: string) => Partial<CustomDashboardDocument>,
    options?: { expectedVersion?: number },
  ): Promise<CustomDashboardDocument> {
    const updated = this.commit(universeId, (records) => {
      const record = records[dashboardId];
      if (!record) {
        throw new CustomDashboardNotFoundError(dashboardId);
      }
      if (options?.expectedVersion !== undefined && options.expectedVersion !== record.version) {
        throw new CustomDashboardVersionConflictError(dashboardId);
      }
      const now = this.clock.isoNow();
      const nextDoc: CustomDashboardDocument = {
        ...record.document,
        ...mutate(now),
        updatedAt: now,
      };
      const next = {
        ...records,
        [dashboardId]: { document: nextDoc, version: record.version + 1 },
      };
      return { next, result: nextDoc };
    });
    this.emit({ universeId, dashboardId, eventType });
    return updated;
  }
}

export default LocalStorageCustomDashboardService;
