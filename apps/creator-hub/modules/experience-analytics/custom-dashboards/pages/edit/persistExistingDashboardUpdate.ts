import type { CustomDashboardService } from '../../service/CustomDashboardService';
import type {
  CustomDashboardConfig,
  CustomDashboardDocument,
  CustomDashboardMutationOptions,
} from '../../types';

export type PersistExistingDashboardUpdateInput = {
  readonly universeId: number;
  readonly dashboardId: string;
  /** When set, included in the same atomic publish as `config`. */
  readonly name?: string;
  readonly config: CustomDashboardConfig;
  readonly options?: CustomDashboardMutationOptions;
};

/**
 * Persist an editor save for an already-created dashboard.
 *
 * Name + config go through one `update()` so the API service can publish the
 * document and optional metadata patch atomically with a single
 * `expectedHeadEtag`. Metadata-only actions (pin/rename without content) still
 * use `UpdateDashboardMetadata`.
 */
export async function persistExistingDashboardUpdate(
  service: CustomDashboardService,
  input: PersistExistingDashboardUpdateInput,
): Promise<CustomDashboardDocument> {
  const { universeId, dashboardId, name, config, options } = input;

  return service.update(
    universeId,
    dashboardId,
    {
      config,
      ...(name !== undefined ? { name } : {}),
    },
    options,
  );
}
