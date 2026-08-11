import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CreatorInventoryAssetType } from '@modules/clients/creatorInventory';
import toolboxClient, { toolboxServiceItemDetailsLimit } from '@modules/clients/toolboxService';
import type { DevelopmentItemsInventoryItem } from './developmentItemsInventoryUtils';

const TOOLBOX_IDS_STALE_TIME_MS = 30_000;

export type DevelopmentItemToolboxIds = {
  meshId?: number | null;
  textureId?: number | null;
};

export const EMPTY_TOOLBOX_IDS: ReadonlyMap<number, DevelopmentItemToolboxIds> = new Map();

const useDevelopmentItemToolboxIds = (items: readonly DevelopmentItemsInventoryItem[]) => {
  const assetIds = useMemo(
    () =>
      [
        ...new Set(
          items
            .filter(
              ({ assetType }) =>
                assetType === CreatorInventoryAssetType.Decal ||
                assetType === CreatorInventoryAssetType.MeshPart,
            )
            .map(({ assetId }) => assetId),
        ),
      ].sort((left, right) => left - right),
    [items],
  );

  return useQuery<ReadonlyMap<number, DevelopmentItemToolboxIds>>({
    queryKey: ['development-item-toolbox-ids', assetIds],
    queryFn: async () => {
      const batches: number[][] = [];
      for (let index = 0; index < assetIds.length; index += toolboxServiceItemDetailsLimit) {
        batches.push(assetIds.slice(index, index + toolboxServiceItemDetailsLimit));
      }

      try {
        const responses = await Promise.all(
          batches.map((batch) => toolboxClient.getItemDetails(batch)),
        );
        const toolboxIds = new Map<number, DevelopmentItemToolboxIds>();
        responses.forEach(({ items: toolboxItems }) => {
          toolboxItems.forEach(({ asset }) => {
            if (asset?.id != null) {
              toolboxIds.set(asset.id, {
                meshId: asset.meshId,
                textureId: asset.textureId,
              });
            }
          });
        });
        return toolboxIds;
      } catch (error) {
        console.warn('Failed to fetch Toolbox IDs for Development Items', error);
        return new Map();
      }
    },
    enabled: assetIds.length > 0,
    placeholderData: EMPTY_TOOLBOX_IDS,
    staleTime: TOOLBOX_IDS_STALE_TIME_MS,
  });
};

export default useDevelopmentItemToolboxIds;
