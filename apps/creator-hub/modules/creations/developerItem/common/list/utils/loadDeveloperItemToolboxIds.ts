import { V1CreationsGetAssetsGetLimitEnum } from '@rbx/client-itemconfiguration/v1';
import developClient from '@modules/clients/develop';
import toolboxClient from '@modules/clients/toolboxService';

/**
 * Page size for the Decal/MeshPart develop-item grids. `itemconfigurationClient.getCreations`
 * only accepts limits of 10/25/50/100, and each page's asset ids are sent to
 * `toolboxClient.getItemDetails` in a single request (max `toolboxServiceItemDetailsLimit` = 30).
 * 25 is the largest valid `getCreations` limit that stays within that toolbox batch cap.
 */
export const developerItemGridLoadPageSize = V1CreationsGetAssetsGetLimitEnum.NUMBER_25;

export type DeveloperItemToolboxIds = {
  meshId?: number | null;
  textureId?: number | null;
};

/**
 * Fetches develop asset details and, in parallel, the toolbox `meshId`/`textureId` enrichments for
 * a page of developer items. The `assetIds` list is bounded by `developerItemGridLoadPageSize` (25),
 * which keeps both the develop and toolbox requests within their single-request limits.
 *
 * `meshId`/`textureId` are non-critical enrichments, so a toolbox failure degrades to an empty map
 * (items still render, just without the Copy Mesh/Texture ID actions) rather than failing the grid.
 */
export async function loadDeveloperItemToolboxIds(assetIds: number[]) {
  const [detailResponse, toolboxDetails] = await Promise.all([
    developClient.getAssetDetails(assetIds),
    toolboxClient.getItemDetails(assetIds).catch((error: unknown) => {
      console.warn('Failed to fetch toolbox item details for developer item grid', error);
      return { items: [] };
    }),
  ]);
  if (!detailResponse.data) {
    throw new Error('Asset detail endpoint returns no data');
  }
  const toolboxIdsByAssetId = new Map<number, DeveloperItemToolboxIds>();
  toolboxDetails.items.forEach(({ asset }) => {
    if (asset?.id != null) {
      toolboxIdsByAssetId.set(asset.id, { meshId: asset.meshId, textureId: asset.textureId });
    }
  });
  return { data: detailResponse.data, toolboxIdsByAssetId };
}
