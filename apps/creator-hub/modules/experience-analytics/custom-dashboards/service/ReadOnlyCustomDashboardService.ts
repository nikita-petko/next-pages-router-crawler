import { CustomDashboardNotAvailableError } from '../errors';
import type {
  AddChartTileInput,
  AddChartTileResult,
  CreateCustomDashboardInput,
  CustomDashboardDocument,
  CustomDashboardListOptions,
  CustomDashboardListResult,
  CustomDashboardMutationOptions,
  UpdateCustomDashboardInput,
} from '../types';
import type {
  CustomDashboardService,
  CustomDashboardServiceChangeListener,
} from './CustomDashboardService';

/**
 * Read-only facade over an API-backed service. Forwards reads; every mutation
 * throws {@link CustomDashboardNotAvailableError}. Used when the API backend
 * is enabled but `canSaveCustomDashboards` is false and hybrid local edits
 * are not available.
 */
class ReadOnlyCustomDashboardService implements CustomDashboardService {
  private readonly inner: CustomDashboardService;

  constructor(inner: CustomDashboardService) {
    this.inner = inner;
  }

  list(
    universeId: number,
    options?: CustomDashboardListOptions,
  ): Promise<CustomDashboardListResult> {
    return this.inner.list(universeId, options);
  }

  get(universeId: number, dashboardId: string): Promise<CustomDashboardDocument> {
    return this.inner.get(universeId, dashboardId);
  }

  async create(input: CreateCustomDashboardInput): Promise<CustomDashboardDocument> {
    void input;
    throw new CustomDashboardNotAvailableError();
  }

  async createAndPublish(input: CreateCustomDashboardInput): Promise<CustomDashboardDocument> {
    void input;
    throw new CustomDashboardNotAvailableError();
  }

  async update(
    universeId: number,
    dashboardId: string,
    changes: UpdateCustomDashboardInput,
    options?: CustomDashboardMutationOptions,
  ): Promise<CustomDashboardDocument> {
    void universeId;
    void dashboardId;
    void changes;
    void options;
    throw new CustomDashboardNotAvailableError();
  }

  async addChartTile(
    universeId: number,
    dashboardId: string,
    input: AddChartTileInput,
    options?: CustomDashboardMutationOptions,
  ): Promise<AddChartTileResult> {
    void universeId;
    void dashboardId;
    void input;
    void options;
    throw new CustomDashboardNotAvailableError();
  }

  async delete(universeId: number, dashboardId: string): Promise<void> {
    void universeId;
    void dashboardId;
    throw new CustomDashboardNotAvailableError();
  }

  async duplicate(
    universeId: number,
    dashboardId: string,
    options: { createdByUserId: number; createdByUsername: string },
  ): Promise<CustomDashboardDocument> {
    void universeId;
    void dashboardId;
    void options;
    throw new CustomDashboardNotAvailableError();
  }

  async publish(
    universeId: number,
    dashboardId: string,
    options?: { expectedVersion?: number },
  ): Promise<CustomDashboardDocument> {
    void universeId;
    void dashboardId;
    void options;
    throw new CustomDashboardNotAvailableError();
  }

  async unpublish(universeId: number, dashboardId: string): Promise<CustomDashboardDocument> {
    void universeId;
    void dashboardId;
    throw new CustomDashboardNotAvailableError();
  }

  async pin(universeId: number, dashboardId: string): Promise<CustomDashboardDocument> {
    void universeId;
    void dashboardId;
    throw new CustomDashboardNotAvailableError();
  }

  async unpin(universeId: number, dashboardId: string): Promise<CustomDashboardDocument> {
    void universeId;
    void dashboardId;
    throw new CustomDashboardNotAvailableError();
  }

  suggestDefaultName(universeId: number): Promise<string> {
    return this.inner.suggestDefaultName(universeId);
  }

  getVersion(universeId: number, dashboardId: string): Promise<number | null> {
    return this.inner.getVersion(universeId, dashboardId);
  }

  subscribe(listener: CustomDashboardServiceChangeListener): () => void {
    return this.inner.subscribe(listener);
  }

  dispose(): void {
    this.inner.dispose?.();
  }
}

export default ReadOnlyCustomDashboardService;
