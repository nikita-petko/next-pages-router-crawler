import { CustomDashboardNotAvailableError, CustomDashboardNotFoundError } from '../errors';
import {
  getChartRows,
  getSummaryCards,
  withChartRows,
  withSummaryCards,
} from '../layout/dashboardLayout';
import type {
  AddChartTileInput,
  AddChartTileResult,
  CreateCustomDashboardInput,
  CustomDashboardConfig,
  CustomDashboardDocument,
  CustomDashboardListItem,
  CustomDashboardListOptions,
  CustomDashboardListResult,
  CustomDashboardMutationOptions,
  UpdateCustomDashboardInput,
} from '../types';
import { cloneTileWithNewId } from '../utils/cloneTile';
import {
  clipDashboardName,
  DUPLICATE_COPY_NUMBERED_SUFFIX_START,
  findUnusedNumberedName,
} from '../utils/suggestDefaultName';
import type {
  CustomDashboardService,
  CustomDashboardServiceChangeListener,
} from './CustomDashboardService';

function isNotFound(error: unknown): error is CustomDashboardNotFoundError {
  return error instanceof CustomDashboardNotFoundError;
}

function asLocalCopyDocument(document: CustomDashboardDocument): CustomDashboardDocument {
  return { ...document, hybridOrigin: 'localCopy' };
}

function asServerDocument(document: CustomDashboardDocument): CustomDashboardDocument {
  return { ...document, hybridOrigin: 'server' };
}

function asLocalCopyItem(item: CustomDashboardListItem): CustomDashboardListItem {
  return { ...item, hybridOrigin: 'localCopy' };
}

function asServerItem(item: CustomDashboardListItem): CustomDashboardListItem {
  return { ...item, hybridOrigin: 'server' };
}

function localCopyName(existingNames: Iterable<string>, sourceName: string): string {
  const firstSuffix = ' (local copy)';
  const firstCandidate = clipDashboardName(`${sourceName}${firstSuffix}`);
  const taken = new Set(Array.from(existingNames, (name) => name.trim()));
  if (!taken.has(firstCandidate)) {
    return firstCandidate;
  }
  return findUnusedNumberedName(
    taken,
    (index) => clipDashboardName(`${sourceName} (local copy ${index})`),
    DUPLICATE_COPY_NUMBERED_SUFFIX_START,
  );
}

function cloneConfigWithFreshTileIds(config: CustomDashboardConfig): CustomDashboardConfig {
  const summaryCards = getSummaryCards(config).map((tile) => cloneTileWithNewId(tile));
  const chartRows = getChartRows(config).map((row) => ({
    ...row,
    tiles: row.tiles.map((tile) => cloneTileWithNewId(tile)),
  }));
  return withChartRows(withSummaryCards(config, summaryCards), chartRows);
}

class HybridCustomDashboardService implements CustomDashboardService {
  private readonly localService: CustomDashboardService;

  private readonly apiService: CustomDashboardService;

  constructor(args: {
    readonly localService: CustomDashboardService;
    readonly apiService: CustomDashboardService;
  }) {
    this.localService = args.localService;
    this.apiService = args.apiService;
  }

  async list(
    universeId: number,
    options?: CustomDashboardListOptions,
  ): Promise<CustomDashboardListResult> {
    const [apiResult, localResult] = await Promise.all([
      this.apiService.list(universeId, options),
      this.localService.list(universeId),
    ]);
    return {
      items: apiResult.items.map(asServerItem),
      localItems: localResult.items.map(asLocalCopyItem),
      nextPageToken: apiResult.nextPageToken,
      migrationFailedCount: apiResult.migrationFailedCount + localResult.migrationFailedCount,
    };
  }

  async get(universeId: number, dashboardId: string): Promise<CustomDashboardDocument> {
    try {
      return asLocalCopyDocument(await this.localService.get(universeId, dashboardId));
    } catch (error) {
      if (!isNotFound(error)) {
        throw error;
      }
    }
    return asServerDocument(await this.apiService.get(universeId, dashboardId));
  }

  async create(input: CreateCustomDashboardInput): Promise<CustomDashboardDocument> {
    return asLocalCopyDocument(await this.localService.create(input));
  }

  async createAndPublish(input: CreateCustomDashboardInput): Promise<CustomDashboardDocument> {
    return asLocalCopyDocument(await this.localService.createAndPublish(input));
  }

  async update(
    universeId: number,
    dashboardId: string,
    changes: UpdateCustomDashboardInput,
    options?: CustomDashboardMutationOptions,
  ): Promise<CustomDashboardDocument> {
    await this.ensureLocalDashboard(universeId, dashboardId);
    return asLocalCopyDocument(
      await this.localService.update(universeId, dashboardId, changes, options),
    );
  }

  async addChartTile(
    universeId: number,
    dashboardId: string,
    input: AddChartTileInput,
    options?: CustomDashboardMutationOptions,
  ): Promise<AddChartTileResult> {
    await this.ensureLocalDashboard(universeId, dashboardId);
    const result = await this.localService.addChartTile(universeId, dashboardId, input, options);
    return { ...result, document: asLocalCopyDocument(result.document) };
  }

  async delete(universeId: number, dashboardId: string): Promise<void> {
    await this.ensureLocalDashboard(universeId, dashboardId);
    await this.localService.delete(universeId, dashboardId);
  }

  async duplicate(
    universeId: number,
    dashboardId: string,
    options: { createdByUserId: number; createdByUsername: string },
  ): Promise<CustomDashboardDocument> {
    try {
      await this.ensureLocalDashboard(universeId, dashboardId);
      return asLocalCopyDocument(
        await this.localService.duplicate(universeId, dashboardId, options),
      );
    } catch (error) {
      if (!isNotFound(error) && !(error instanceof CustomDashboardNotAvailableError)) {
        throw error;
      }
    }
    return this.forkApiDashboardToLocal(universeId, dashboardId, options);
  }

  async forkApiDashboardToLocal(
    universeId: number,
    dashboardId: string,
    options: { createdByUserId: number; createdByUsername: string },
  ): Promise<CustomDashboardDocument> {
    const source = await this.apiService.get(universeId, dashboardId);
    const localList = await this.localService.list(universeId);
    const created = await this.localService.create({
      universeId,
      name: localCopyName(
        localList.items.map((item) => item.name),
        source.name,
      ),
      description: source.description,
      createdByUserId: options.createdByUserId,
      createdByUsername: options.createdByUsername,
      config: cloneConfigWithFreshTileIds(source.config),
    });
    return asLocalCopyDocument(created);
  }

  async publish(
    universeId: number,
    dashboardId: string,
    options?: { expectedVersion?: number },
  ): Promise<CustomDashboardDocument> {
    await this.ensureLocalDashboard(universeId, dashboardId);
    return asLocalCopyDocument(await this.localService.publish(universeId, dashboardId, options));
  }

  async unpublish(universeId: number, dashboardId: string): Promise<CustomDashboardDocument> {
    await this.ensureLocalDashboard(universeId, dashboardId);
    return asLocalCopyDocument(await this.localService.unpublish(universeId, dashboardId));
  }

  async pin(universeId: number, dashboardId: string): Promise<CustomDashboardDocument> {
    await this.ensureLocalDashboard(universeId, dashboardId);
    return asLocalCopyDocument(await this.localService.pin(universeId, dashboardId));
  }

  async unpin(universeId: number, dashboardId: string): Promise<CustomDashboardDocument> {
    await this.ensureLocalDashboard(universeId, dashboardId);
    return asLocalCopyDocument(await this.localService.unpin(universeId, dashboardId));
  }

  async suggestDefaultName(universeId: number): Promise<string> {
    return this.localService.suggestDefaultName(universeId);
  }

  async getVersion(universeId: number, dashboardId: string): Promise<number | null> {
    try {
      await this.ensureLocalDashboard(universeId, dashboardId);
    } catch (error) {
      if (error instanceof CustomDashboardNotAvailableError) {
        return null;
      }
      throw error;
    }
    return this.localService.getVersion(universeId, dashboardId);
  }

  subscribe(listener: CustomDashboardServiceChangeListener): () => void {
    const unsubscribeLocal = this.localService.subscribe(listener);
    const unsubscribeApi = this.apiService.subscribe(listener);
    return () => {
      unsubscribeLocal();
      unsubscribeApi();
    };
  }

  dispose(): void {
    this.localService.dispose?.();
    this.apiService.dispose?.();
  }

  private async ensureLocalDashboard(
    universeId: number,
    dashboardId: string,
  ): Promise<CustomDashboardDocument> {
    try {
      return asLocalCopyDocument(await this.localService.get(universeId, dashboardId));
    } catch (error) {
      if (isNotFound(error)) {
        throw new CustomDashboardNotAvailableError();
      }
      throw error;
    }
  }
}

export default HybridCustomDashboardService;
