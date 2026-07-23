import {
  CustomDashboardNotFoundError,
  CustomDashboardQuotaExceededError,
  CustomDashboardVersionConflictError,
} from '../errors';
import {
  getChartRows,
  getSummaryCards,
  withChartRows,
  withSummaryCards,
} from '../layout/dashboardLayout';
import {
  type AddChartTileInput,
  type AddChartTileResult,
  type CreateCustomDashboardInput,
  CUSTOM_DASHBOARD_CURRENT_SCHEMA_VERSION,
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
  validateCustomDashboardConfig,
  validateDashboardDescription,
  validateDashboardName,
} from '../utils/validators';
import type {
  CustomDashboardService,
  CustomDashboardServiceChangeEvent,
  CustomDashboardServiceChangeListener,
} from './CustomDashboardService';
import { pageLocalItems } from './pageLocalItems';

/**
 * Process-lifetime in-memory implementation; used by tests and as a fallback
 * when localStorage is unavailable. Storage is
 * `Map<universeId, Map<dashboardId, …>>`. Service code never reads
 * `Date.now()` or `Math.random` directly.
 */

type VersionedRecord = {
  readonly document: CustomDashboardDocument;
  readonly version: number;
};

export type InMemoryCustomDashboardServiceOptions = {
  readonly clock?: Clock;
  readonly idFactory?: IdFactory;
  readonly duplicateNameSuffixes?: DuplicateDashboardNameSuffixes;
};

class InMemoryCustomDashboardService implements CustomDashboardService {
  private readonly store = new Map<number, Map<string, VersionedRecord>>();

  private readonly listeners = new Set<CustomDashboardServiceChangeListener>();

  private readonly clock: Clock;

  private readonly idFactory: IdFactory;

  private readonly duplicateNameSuffixes: DuplicateDashboardNameSuffixes;

  constructor(options: InMemoryCustomDashboardServiceOptions = {}) {
    this.clock = options.clock ?? systemClock;
    // Tests inject `createDeterministicIdFactory()` via `options.idFactory`
    // for reproducible ids. Production uses `defaultIdFactory` which calls
    // `crypto.randomUUID()` directly — no clock plumbing through ids.
    this.idFactory = options.idFactory ?? defaultIdFactory;
    this.duplicateNameSuffixes =
      options.duplicateNameSuffixes ?? testOnlyEnglishDuplicateDashboardNameSuffixes;
  }

  /**
   * Return the universe's record map for read-only inspection. Returns
   * `undefined` if the universe has never been written. Use this on lookup
   * paths so a `NotFound` doesn't leave behind an empty map.
   */
  private peekUniverseMap(universeId: number): Map<string, VersionedRecord> | undefined {
    return this.store.get(universeId);
  }

  /** Return the universe map, creating it if absent. Call only when committing. */
  private getOrCreateUniverseMap(universeId: number): Map<string, VersionedRecord> {
    let universeMap = this.store.get(universeId);
    if (!universeMap) {
      universeMap = new Map();
      this.store.set(universeId, universeMap);
    }
    return universeMap;
  }

  private emit(event: CustomDashboardServiceChangeEvent): void {
    // Snapshot before iterating so a listener that calls unsubscribe (its own
    // or a peer's) can't skip the rest of the queue.
    Array.from(this.listeners).forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        // Listener errors never poison the service — see CustomDashboardService.subscribe
        // docs. Log a console.warn so a misbehaving subscriber doesn't fail
        // silently in dev; production builds keep the same swallow semantics.
        console.warn('[CustomDashboardService] listener threw; ignoring.', error);
      }
    });
  }

  private assertUnderUniverseCap(universeId: number): void {
    const count = this.peekUniverseMap(universeId)?.size ?? 0;
    if (count >= MAX_DASHBOARDS_PER_UNIVERSE) {
      throw new CustomDashboardQuotaExceededError(
        `Universe ${universeId} is at the per-universe cap of ${MAX_DASHBOARDS_PER_UNIVERSE} dashboards. Delete one to create another.`,
      );
    }
  }

  /**
   * Resolve a `(universeId, dashboardId)` pair to a live record or throw
   * `NotFound`. Returns the universe map alongside the record so callers can
   * `.set` / `.delete` against the same reference without re-walking the
   * outer map. Used by every mutation that operates on an existing record.
   */
  private loadOrThrow(
    universeId: number,
    dashboardId: string,
  ): { universeMap: Map<string, VersionedRecord>; record: VersionedRecord } {
    const universeMap = this.peekUniverseMap(universeId);
    const record = universeMap?.get(dashboardId);
    if (!universeMap || !record) {
      throw new CustomDashboardNotFoundError(dashboardId);
    }
    return { universeMap, record };
  }

  /**
   * Apply a single-record mutation: load-or-throw, run the caller's `mutate`
   * to produce the field overrides, stamp `updatedAt`, persist, emit. Every
   * status- and pin-style mutation funnels through here so the load /
   * version-bump / emit ceremony lives in exactly one place; callers
   * declare *what* changes by returning a partial document.
   *
   * The callback receives just the timestamp — every existing caller wanted
   * `now` for `pinnedAt` / `publishedAt` and none needed the prior document.
   * If a future mutation needs the prior doc, take it from `loadOrThrow`'s
   * return rather than re-broadening the callback signature.
   */
  private async applyMutation(
    universeId: number,
    dashboardId: string,
    eventType: 'add-chart-tile' | 'publish' | 'unpublish' | 'pin' | 'unpin',
    mutate: (now: string) => Partial<CustomDashboardDocument>,
    options?: { expectedVersion?: number },
  ): Promise<CustomDashboardDocument> {
    const { universeMap, record } = this.loadOrThrow(universeId, dashboardId);
    if (options?.expectedVersion !== undefined && options.expectedVersion !== record.version) {
      throw new CustomDashboardVersionConflictError(dashboardId);
    }
    const now = this.clock.isoNow();
    const updated: CustomDashboardDocument = {
      ...record.document,
      ...mutate(now),
      updatedAt: now,
    };
    universeMap.set(dashboardId, { document: updated, version: record.version + 1 });
    this.emit({ universeId, dashboardId, eventType });
    return updated;
  }

  private async applyUpdateMutation<Result>(
    universeId: number,
    dashboardId: string,
    eventType: 'update' | 'add-chart-tile',
    mutate: (
      record: VersionedRecord,
      now: string,
    ) => {
      readonly document: CustomDashboardDocument;
      readonly result: Result;
    },
    options?: CustomDashboardMutationOptions,
  ): Promise<Result> {
    const { universeMap, record } = this.loadOrThrow(universeId, dashboardId);
    if (options?.expectedVersion !== undefined && options.expectedVersion !== record.version) {
      throw new CustomDashboardVersionConflictError(dashboardId);
    }
    const now = this.clock.isoNow();
    const { document, result } = mutate(record, now);
    universeMap.set(dashboardId, { document, version: record.version + 1 });
    this.emit({ universeId, dashboardId, eventType });
    return result;
  }

  async list(
    universeId: number,
    options?: CustomDashboardListOptions,
  ): Promise<CustomDashboardListResult> {
    const universeMap = this.peekUniverseMap(universeId);
    const allItems = universeMap
      ? sortDashboardsForList([...universeMap.values()].map((r) => r.document))
      : [];
    return { ...pageLocalItems(allItems, options), migrationFailedCount: 0 };
  }

  async get(universeId: number, dashboardId: string): Promise<CustomDashboardDocument> {
    return this.loadOrThrow(universeId, dashboardId).record.document;
  }

  async getVersion(universeId: number, dashboardId: string): Promise<number | null> {
    return this.peekUniverseMap(universeId)?.get(dashboardId)?.version ?? null;
  }

  /** Build + persist a new record. Shared by `create` and `createAndPublish`. */
  private insertNewDocument(
    input: CreateCustomDashboardInput,
    status: 'draft' | 'published',
  ): CustomDashboardDocument {
    this.assertUnderUniverseCap(input.universeId);
    const name = validateDashboardName(input.name);
    const description = validateDashboardDescription(input.description);
    // Substitute the empty config at the service boundary before validation.
    // The validator (PR1) requires `config` and rejects missing fields as
    // corruption; defaulting here keeps the convenient "create with no
    // body" UX without weakening the validator's contract.
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

    const universeMap = this.getOrCreateUniverseMap(input.universeId);
    universeMap.set(document.id, { document, version: 1 });
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
    const { universeMap, record } = this.loadOrThrow(universeId, dashboardId);
    if (options?.expectedVersion !== undefined && options.expectedVersion !== record.version) {
      throw new CustomDashboardVersionConflictError(dashboardId);
    }

    // Validate before mutating so a thrown ValidationError can't leave a
    // half-updated document.
    const nextName =
      changes.name !== undefined ? validateDashboardName(changes.name) : record.document.name;
    const nextDescription =
      changes.description !== undefined
        ? validateDashboardDescription(changes.description)
        : record.document.description;
    const nextConfig =
      changes.config !== undefined
        ? validateCustomDashboardConfig(changes.config)
        : record.document.config;

    const updated: CustomDashboardDocument = {
      ...record.document,
      name: nextName,
      description: nextDescription,
      config: nextConfig,
      updatedAt: this.clock.isoNow(),
      ...(options?.actor
        ? {
            updatedByUserId: options.actor.userId,
            updatedByUsername: options.actor.username,
          }
        : {}),
    };
    universeMap.set(dashboardId, { document: updated, version: record.version + 1 });
    this.emit({ universeId, dashboardId, eventType: 'update' });
    return updated;
  }

  async addChartTile(
    universeId: number,
    dashboardId: string,
    input: AddChartTileInput,
    options?: CustomDashboardMutationOptions,
  ): Promise<AddChartTileResult> {
    return this.applyUpdateMutation(
      universeId,
      dashboardId,
      'add-chart-tile',
      (record, now) => {
        const { config, tile } = addChartTileToConfig({
          config: record.document.config,
          tile: input.tile,
          nextTileId: this.idFactory.nextTileId(),
        });
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
        return { document, result: { document, tile } };
      },
      options,
    );
  }

  async delete(universeId: number, dashboardId: string): Promise<void> {
    const { universeMap } = this.loadOrThrow(universeId, dashboardId);
    universeMap.delete(dashboardId);
    this.emit({ universeId, dashboardId, eventType: 'delete' });
  }

  async duplicate(
    universeId: number,
    dashboardId: string,
    options: { createdByUserId: number; createdByUsername: string },
  ): Promise<CustomDashboardDocument> {
    const source = this.loadOrThrow(universeId, dashboardId).record.document;
    this.assertUnderUniverseCap(universeId);
    const now = this.clock.isoNow();
    const nextName = this.dedupeName(universeId, source.name);
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
      name: nextName,
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
    this.getOrCreateUniverseMap(universeId).set(document.id, { document, version: 1 });
    this.emit({ universeId, dashboardId: document.id, eventType: 'duplicate' });
    return document;
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
    const universeMap = this.peekUniverseMap(universeId);
    return suggestDefaultName(
      universeMap ? [...universeMap.values()].map((r) => r.document.name) : [],
    );
  }

  subscribe(listener: CustomDashboardServiceChangeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Return a non-colliding "Foo (copy [N])" variant of `baseName`. Reuses
   * `findUnusedNumberedName` so the algorithm matches `suggestDefaultName`'s
   * scan-existing-names policy: pick the smallest positive integer such
   * that the formatted candidate is unused. The first candidate is the
   * un-numbered "Foo (copy)"; the search starts at `n = 2` for the numbered
   * variants.
   */
  private dedupeName(universeId: number, baseName: string): string {
    const universeMap = this.peekUniverseMap(universeId);
    const existing = universeMap ? [...universeMap.values()].map((r) => r.document.name) : [];
    return buildDuplicateDashboardName(existing, baseName, this.duplicateNameSuffixes);
  }
}

export default InMemoryCustomDashboardService;
