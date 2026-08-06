import { useQuery } from '@tanstack/react-query';
import type { V1CreationsGetAssetsGetLimitEnum } from '@rbx/client-itemconfiguration/v1';
import { CreatorInventorySourceType } from '@modules/clients/creatorInventory';
import itemconfigurationClient from '@modules/clients/itemconfiguration';
import {
  getLegacyDevelopmentItemsAssetType,
  isDevelopmentItemDirectlyArchivable,
  type DevelopmentItemsAssetTypeSelection,
  type DevelopmentItemsInventoryItem,
} from './developmentItemsInventoryUtils';
import fetchDevelopmentItemAssetDetails from './fetchDevelopmentItemAssetDetails';

export const LEGACY_ARCHIVED_DEFAULT_PAGE_SIZE = 25;
export const LEGACY_ARCHIVED_PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

const getLegacyArchivedPageSize = (pageSize: number): V1CreationsGetAssetsGetLimitEnum => {
  switch (pageSize) {
    case 10:
    case 25:
    case 50:
    case 100:
      return pageSize;
    default:
      return LEGACY_ARCHIVED_DEFAULT_PAGE_SIZE;
  }
};

export const fetchLegacyArchivedDevelopmentItems = async ({
  assetType,
  groupId,
  pageSize,
  pageToken,
  signal,
}: {
  assetType: DevelopmentItemsAssetTypeSelection;
  groupId?: number;
  pageSize: number;
  pageToken?: string;
  signal?: AbortSignal;
}) => {
  const response = await itemconfigurationClient.getCreations(
    getLegacyDevelopmentItemsAssetType(assetType),
    true,
    groupId,
    getLegacyArchivedPageSize(pageSize),
    pageToken,
  );
  const assetIds = (response.data ?? []).flatMap((item) =>
    item.assetId == null ? [] : [item.assetId],
  );

  if (signal?.aborted === true || assetIds.length === 0) {
    return {
      archivableAssetIds: new Set<number>() as ReadonlySet<number>,
      items: [] as DevelopmentItemsInventoryItem[],
      nextPageToken: response.nextPageCursor ?? undefined,
    };
  }

  const assetDetails = await fetchDevelopmentItemAssetDetails(assetIds, signal);
  const detailsByAssetId = new Map(
    assetDetails.flatMap((item) => (item.id == null ? [] : [[item.id, item] as const])),
  );
  const archivableAssetIds = new Set<number>();
  const items = assetIds.flatMap<DevelopmentItemsInventoryItem>((assetId) => {
    const details = detailsByAssetId.get(assetId);
    if (details == null) {
      return [];
    }
    const name = details.name?.trim();
    if (isDevelopmentItemDirectlyArchivable(assetType) && details.isArchivable === true) {
      archivableAssetIds.add(assetId);
    }
    return [
      {
        id: `archived-asset-${assetId}`,
        assetId,
        assetType,
        created: details.created ?? undefined,
        isPackage: false,
        name: name == null || name.length === 0 ? assetId.toString() : name,
        sources: [CreatorInventorySourceType.Created],
        state: 'Archived',
      },
    ];
  });

  return {
    archivableAssetIds: archivableAssetIds as ReadonlySet<number>,
    items,
    nextPageToken: response.nextPageCursor ?? undefined,
  };
};

const useLegacyArchivedDevelopmentItemsInventory = ({
  assetType,
  enabled,
  groupId,
  pageSize,
  pageToken,
}: {
  assetType: DevelopmentItemsAssetTypeSelection;
  enabled: boolean;
  groupId?: number;
  pageSize: number;
  pageToken?: string;
}) =>
  useQuery({
    queryKey: ['legacy-archived-development-items', groupId, assetType, pageSize, pageToken],
    queryFn: ({ signal }) =>
      fetchLegacyArchivedDevelopmentItems({
        assetType,
        groupId,
        pageSize,
        pageToken,
        signal,
      }),
    enabled,
  });

export default useLegacyArchivedDevelopmentItemsInventory;
