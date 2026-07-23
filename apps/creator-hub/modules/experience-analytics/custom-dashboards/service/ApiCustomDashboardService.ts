import {
  CustomDashboardNotAvailableError,
  CustomDashboardValidationError,
  CustomDashboardVersionConflictError,
} from '../errors';
import {
  EMPTY_DASHBOARD_CONFIG,
  type AddChartTileInput,
  type AddChartTileResult,
  type CreateCustomDashboardInput,
  type CustomDashboardDocument,
  type CustomDashboardListOptions,
  type CustomDashboardListResult,
  type CustomDashboardMutationOptions,
  type UpdateCustomDashboardInput,
} from '../types';
import { addChartTileToConfig } from '../utils/addChartTileToConfig';
import { createTileId } from '../utils/createTileId';
import { sortDashboardsForList } from '../utils/sortDashboards';
import {
  DUPLICATE_COPY_NUMBERED_SUFFIX_START,
  findUnusedNumberedName,
  suggestDefaultName,
} from '../utils/suggestDefaultName';
import {
  validateCustomDashboardConfig,
  validateDashboardDescription,
  validateDashboardName,
} from '../utils/validators';
import {
  createDefaultCustomDashboardsApiClient,
  type ApiDashboardMetadata,
  type CustomDashboardsApiClient,
} from './customDashboardsApiClient';
import { mapCustomDashboardsApiError } from './customDashboardsApiErrors';
import {
  fromApiDashboard,
  fromApiDashboardMetadata,
  getDashboardId,
  getHeadEtag,
  toApiDashboardDocument,
} from './customDashboardsApiMappers';
import type {
  CustomDashboardService,
  CustomDashboardServiceChangeEvent,
  CustomDashboardServiceChangeListener,
} from './CustomDashboardService';

type TokenState = {
  readonly headEtag?: string;
  readonly revision: number;
  readonly headEtagsByRevision: ReadonlyMap<number, string>;
};

function tokenKey(universeId: number, dashboardId: string): string {
  return `${universeId}:${dashboardId}`;
}

class ApiCustomDashboardService implements CustomDashboardService {
  private readonly client: CustomDashboardsApiClient;

  private readonly listeners = new Set<CustomDashboardServiceChangeListener>();

  private readonly tokens = new Map<string, TokenState>();

  private disposed = false;

  constructor(client: CustomDashboardsApiClient = createDefaultCustomDashboardsApiClient()) {
    this.client = client;
  }

  async list(
    universeId: number,
    options?: CustomDashboardListOptions,
  ): Promise<CustomDashboardListResult> {
    return this.withApiErrors(universeId, undefined, async () => {
      this.ensureAvailable();
      const response = options
        ? await this.client.listDashboards(universeId, options)
        : await this.listAllDashboards(universeId);
      const items = (response.dashboards ?? []).map((metadata) => {
        this.rememberMetadata(universeId, metadata);
        return fromApiDashboardMetadata(metadata);
      });
      return {
        items: sortDashboardsForList(items),
        migrationFailedCount: 0,
        nextPageToken: options ? (response.nextPageToken ?? undefined) : undefined,
      };
    });
  }

  async get(universeId: number, dashboardId: string): Promise<CustomDashboardDocument> {
    return this.withApiErrors(universeId, dashboardId, async () => {
      this.ensureAvailable();
      const dashboard = await this.client.getDashboard({
        universeId,
        dashboardId,
      });
      this.rememberMetadata(universeId, dashboard.metadata);
      return fromApiDashboard(dashboard);
    });
  }

  async getVersion(universeId: number, dashboardId: string): Promise<number | null> {
    return this.withApiErrors(universeId, dashboardId, async () => {
      this.ensureAvailable();
      const existing = this.tokens.get(tokenKey(universeId, dashboardId));
      if (existing) {
        return existing.revision;
      }
      await this.get(universeId, dashboardId);
      return this.tokens.get(tokenKey(universeId, dashboardId))?.revision ?? null;
    });
  }

  async create(input: CreateCustomDashboardInput): Promise<CustomDashboardDocument> {
    return this.withApiErrors(input.universeId, undefined, async () => {
      this.ensureAvailable();
      const name = validateDashboardName(input.name);
      const description = validateDashboardDescription(input.description);
      const config =
        input.config !== undefined
          ? validateCustomDashboardConfig(input.config)
          : EMPTY_DASHBOARD_CONFIG;

      const dashboard = await this.client.createDashboard({
        universeId: input.universeId,
        name,
        description,
        document: toApiDashboardDocument(config),
      });
      this.rememberMetadata(input.universeId, dashboard.metadata);
      const document = fromApiDashboard(dashboard);
      this.emit({ universeId: input.universeId, dashboardId: document.id, eventType: 'create' });
      return document;
    });
  }

  async update(
    universeId: number,
    dashboardId: string,
    changes: UpdateCustomDashboardInput,
    options?: CustomDashboardMutationOptions,
  ): Promise<CustomDashboardDocument> {
    return this.withApiErrors(universeId, dashboardId, async () => {
      this.ensureAvailable();
      const metadataPatch: { name?: string; description?: string } = {};
      if (changes.name !== undefined) {
        metadataPatch.name = validateDashboardName(changes.name);
      }
      if (changes.description !== undefined) {
        metadataPatch.description = validateDashboardDescription(changes.description) ?? '';
      }

      const config =
        changes.config !== undefined ? validateCustomDashboardConfig(changes.config) : undefined;

      const hasMetadataChanges =
        metadataPatch.name !== undefined || metadataPatch.description !== undefined;
      const hasDocumentChanges = config !== undefined;
      if (!hasMetadataChanges && !hasDocumentChanges) {
        return this.get(universeId, dashboardId);
      }
      if (hasMetadataChanges && hasDocumentChanges) {
        throw new CustomDashboardValidationError(
          'changes',
          'The API backend cannot atomically update dashboard metadata and content.',
        );
      }

      let tokenState = await this.ensureTokens(universeId, dashboardId);
      const expectedVersion = options?.expectedVersion;
      let mutationDocument: CustomDashboardDocument | undefined;
      if (hasMetadataChanges) {
        const metadata = await this.client.updateDashboardMetadata({
          universeId,
          dashboardId,
          expectedHeadEtag: this.requireHeadEtag(tokenState, dashboardId, expectedVersion),
          patch: metadataPatch,
        });
        tokenState = this.rememberMetadata(universeId, metadata);
      }

      if (config !== undefined) {
        const dashboard = await this.client.publishDashboard({
          universeId,
          dashboardId,
          expectedHeadEtag: this.requireHeadEtag(
            tokenState,
            dashboardId,
            hasMetadataChanges ? undefined : expectedVersion,
          ),
          document: toApiDashboardDocument(config),
        });
        this.rememberMetadata(universeId, dashboard.metadata);
        mutationDocument = fromApiDashboard(dashboard);
      }

      this.emit({ universeId, dashboardId, eventType: 'update' });
      return mutationDocument ?? this.get(universeId, dashboardId);
    });
  }

  async createAndPublish(input: CreateCustomDashboardInput): Promise<CustomDashboardDocument> {
    const created = await this.create(input);
    try {
      return await this.publish(input.universeId, created.id);
    } catch (publishError) {
      try {
        const current = await this.get(input.universeId, created.id);
        if (current.status === 'published') {
          return current;
        }
        return await this.publish(input.universeId, created.id);
      } catch {
        throw publishError;
      }
    }
  }

  async addChartTile(
    universeId: number,
    dashboardId: string,
    input: AddChartTileInput,
    options?: CustomDashboardMutationOptions,
  ): Promise<AddChartTileResult> {
    return this.withApiErrors(universeId, dashboardId, async () => {
      this.ensureAvailable();
      const source = await this.get(universeId, dashboardId);
      const { config, tile } = addChartTileToConfig({
        config: source.config,
        tile: input.tile,
        nextTileId: createTileId(),
      });
      const tokens = await this.ensureTokens(universeId, dashboardId);
      const dashboard = await this.client.publishDashboard({
        universeId,
        dashboardId,
        expectedHeadEtag: this.requireHeadEtag(tokens, dashboardId, options?.expectedVersion),
        document: toApiDashboardDocument(config),
      });
      this.rememberMetadata(universeId, dashboard.metadata);
      const document = fromApiDashboard(dashboard);
      this.emit({ universeId, dashboardId, eventType: 'add-chart-tile' });
      return { document, tile };
    });
  }

  async delete(universeId: number, dashboardId: string): Promise<void> {
    return this.withApiErrors(universeId, dashboardId, async () => {
      this.ensureAvailable();
      const tokens = await this.ensureTokens(universeId, dashboardId);
      await this.client.deleteDashboard({
        universeId,
        dashboardId,
        expectedHeadEtag: this.requireHeadEtag(tokens, dashboardId),
      });
      this.tokens.delete(tokenKey(universeId, dashboardId));
      this.emit({ universeId, dashboardId, eventType: 'delete' });
    });
  }

  async duplicate(
    universeId: number,
    dashboardId: string,
    options: { createdByUserId: number; createdByUsername: string },
  ): Promise<CustomDashboardDocument> {
    return this.withApiErrors(universeId, dashboardId, async () => {
      void options;
      this.ensureAvailable();
      const [source, list] = await Promise.all([
        this.get(universeId, dashboardId),
        this.list(universeId),
      ]);
      const name = this.dedupeName(
        source.name,
        list.items.map((item) => item.name),
      );
      const dashboard = await this.client.duplicateDashboard({
        universeId,
        dashboardId,
        destinationUniverseId: universeId,
        name,
      });
      this.rememberMetadata(universeId, dashboard.metadata);
      const document = fromApiDashboard(dashboard);
      this.emit({ universeId, dashboardId: document.id, eventType: 'duplicate' });
      return document;
    });
  }

  async publish(
    universeId: number,
    dashboardId: string,
    options?: { expectedVersion?: number },
  ): Promise<CustomDashboardDocument> {
    return this.withApiErrors(universeId, dashboardId, async () => {
      this.ensureAvailable();
      const current = await this.get(universeId, dashboardId);
      const tokens = await this.ensureTokens(universeId, dashboardId);
      const dashboard = await this.client.publishDashboard({
        universeId,
        dashboardId,
        expectedHeadEtag: this.requireHeadEtag(tokens, dashboardId, options?.expectedVersion),
        document: toApiDashboardDocument(current.config),
      });
      this.rememberMetadata(universeId, dashboard.metadata);
      const document = fromApiDashboard(dashboard);
      this.emit({ universeId, dashboardId, eventType: 'publish' });
      return document;
    });
  }

  async unpublish(universeId: number, dashboardId: string): Promise<CustomDashboardDocument> {
    return this.withApiErrors(universeId, dashboardId, async () => {
      this.ensureAvailable();
      throw new CustomDashboardNotAvailableError();
    });
  }

  async pin(universeId: number, dashboardId: string): Promise<CustomDashboardDocument> {
    return this.updatePinned(universeId, dashboardId, true);
  }

  async unpin(universeId: number, dashboardId: string): Promise<CustomDashboardDocument> {
    return this.updatePinned(universeId, dashboardId, false);
  }

  async suggestDefaultName(universeId: number): Promise<string> {
    const list = await this.list(universeId);
    return suggestDefaultName(list.items.map((item) => item.name));
  }

  subscribe(listener: CustomDashboardServiceChangeListener): () => void {
    this.ensureAvailable();
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  dispose(): void {
    this.disposed = true;
    this.listeners.clear();
    this.tokens.clear();
  }

  private async updatePinned(
    universeId: number,
    dashboardId: string,
    isPinned: boolean,
  ): Promise<CustomDashboardDocument> {
    return this.withApiErrors(universeId, dashboardId, async () => {
      this.ensureAvailable();
      const tokens = await this.ensureTokens(universeId, dashboardId);
      const metadata = await this.client.updateDashboardMetadata({
        universeId,
        dashboardId,
        expectedHeadEtag: this.requireHeadEtag(tokens, dashboardId),
        patch: { isPinned },
      });
      this.rememberMetadata(universeId, metadata);
      this.emit({ universeId, dashboardId, eventType: isPinned ? 'pin' : 'unpin' });
      return this.get(universeId, dashboardId);
    });
  }

  private async ensureTokens(universeId: number, dashboardId: string): Promise<TokenState> {
    const existing = this.tokens.get(tokenKey(universeId, dashboardId));
    if (existing) {
      return existing;
    }
    await this.get(universeId, dashboardId);
    const tokens = this.tokens.get(tokenKey(universeId, dashboardId));
    if (!tokens) {
      throw new CustomDashboardVersionConflictError(dashboardId);
    }
    return tokens;
  }

  private rememberMetadata(
    universeId: number,
    metadata: ApiDashboardMetadata | undefined,
  ): TokenState {
    const dashboardId = metadata ? getDashboardId(metadata) : '';
    const key = tokenKey(universeId, dashboardId);
    const existing = this.tokens.get(key);
    const headEtag = metadata ? getHeadEtag(metadata) : undefined;
    const changed = !existing || existing.headEtag !== headEtag;
    const revision = changed ? (existing?.revision ?? 0) + 1 : existing.revision;
    const headEtagsByRevision = new Map(existing?.headEtagsByRevision);
    if (headEtag) {
      headEtagsByRevision.set(revision, headEtag);
    }
    const state = { headEtag, revision, headEtagsByRevision };
    if (dashboardId) {
      this.tokens.set(key, state);
    }
    return state;
  }

  private requireHeadEtag(
    tokens: TokenState,
    dashboardId: string,
    expectedVersion?: number,
  ): string {
    const headEtag =
      expectedVersion === undefined
        ? tokens.headEtag
        : tokens.headEtagsByRevision.get(expectedVersion);
    if (!headEtag) {
      throw new CustomDashboardVersionConflictError(dashboardId);
    }
    return headEtag;
  }

  private async refreshTokens(universeId: number, dashboardId: string): Promise<void> {
    try {
      const dashboard = await this.client.getDashboard({ universeId, dashboardId });
      this.rememberMetadata(universeId, dashboard.metadata);
    } catch {
      // Keep the original conflict as the user-visible failure. The refresh is
      // best-effort so a secondary load problem does not mask the save result.
    }
  }

  private dedupeName(baseName: string, existingNames: ReadonlyArray<string>): string {
    const taken = new Set(existingNames.map((name) => name.trim()));
    const firstCandidate = `${baseName} (copy)`;
    if (!taken.has(firstCandidate)) {
      return firstCandidate;
    }
    return findUnusedNumberedName(
      existingNames,
      (n) => `${baseName} (copy ${n})`,
      DUPLICATE_COPY_NUMBERED_SUFFIX_START,
    );
  }

  private async listAllDashboards(
    universeId: number,
    pageToken?: string,
    accumulated: ReadonlyArray<ApiDashboardMetadata> = [],
  ): Promise<{
    readonly dashboards: ReadonlyArray<ApiDashboardMetadata>;
    readonly nextPageToken?: string;
  }> {
    const response = await this.client.listDashboards(
      universeId,
      pageToken ? { pageToken } : undefined,
    );
    const dashboards = [...accumulated, ...(response.dashboards ?? [])];
    const nextPageToken = response.nextPageToken ?? undefined;
    return nextPageToken
      ? this.listAllDashboards(universeId, nextPageToken, dashboards)
      : { dashboards };
  }

  private emit(event: CustomDashboardServiceChangeEvent): void {
    Array.from(this.listeners).forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        // Keep subscription semantics aligned with localStorage/in-memory implementations.
        // eslint-disable-next-line no-console -- listener failures should not break mutations
        console.warn('CustomDashboardService listener threw', err);
      }
    });
  }

  private ensureAvailable(): void {
    if (this.disposed) {
      throw new CustomDashboardNotAvailableError();
    }
  }

  private async withApiErrors<T>(
    universeId: number | undefined,
    dashboardId: string | undefined,
    action: () => Promise<T>,
  ): Promise<T> {
    try {
      return await action();
    } catch (err) {
      const mapped = mapCustomDashboardsApiError(err, dashboardId);
      if (
        mapped instanceof CustomDashboardVersionConflictError &&
        universeId !== undefined &&
        dashboardId
      ) {
        await this.refreshTokens(universeId, dashboardId);
      }
      throw mapped;
    }
  }
}

export default ApiCustomDashboardService;
