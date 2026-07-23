import type { CustomDashboardService } from '../../service/CustomDashboardService';
import type {
  CustomDashboardConfig,
  CustomDashboardDocument,
  CustomDashboardMutationOptions,
} from '../../types';

export type PersistExistingDashboardUpdateInput = {
  readonly universeId: number;
  readonly dashboardId: string;
  /** When set, rename after publishing document content. */
  readonly name?: string;
  readonly config: CustomDashboardConfig;
  readonly options?: CustomDashboardMutationOptions;
};

/**
 * Persist an editor save for an already-created dashboard.
 *
 * The API backend cannot atomically patch metadata and publish document
 * content in one `update()` call. When a rename is included, this helper
 * sequences content then metadata so a failed publish leaves the prior
 * name/config pair intact (better than renaming before a content failure).
 *
 * OCC: `options.expectedVersion` is applied to the content publish first. The
 * optional rename then uses etags / versions refreshed by that write.
 */
export async function persistExistingDashboardUpdate(
  service: CustomDashboardService,
  input: PersistExistingDashboardUpdateInput,
): Promise<CustomDashboardDocument> {
  const { universeId, dashboardId, name, config, options } = input;

  const savedDocument = await service.update(universeId, dashboardId, { config }, options);

  if (name === undefined) {
    return savedDocument;
  }

  return service.update(
    universeId,
    dashboardId,
    { name },
    options?.actor !== undefined ? { actor: options.actor } : undefined,
  );
}
