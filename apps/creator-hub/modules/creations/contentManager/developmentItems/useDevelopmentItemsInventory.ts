import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import creatorInventoryClient from '@modules/clients/creatorInventory';
import type { CreatorInventoryScope } from '@modules/clients/creatorInventory';
import {
  DEVELOPMENT_ITEMS_INVENTORY_QUERY_KEY,
  reconcileDevelopmentItemsInventoryMetadata,
} from '../../common/utils/developmentItemsInventoryCache';
import {
  buildCreatorInventorySearchFilter,
  mapCreatorInventoryItem,
  type DevelopmentItemsAssetTypeSelection,
  type DevelopmentItemsSourceSelection,
} from './developmentItemsInventoryUtils';

const DEFAULT_PAGE_SIZE = 30;
const PAGE_SIZE_OPTIONS = [10, 25, 30, 50, 100, 250, 500] as const;
// Avoid redundant requests during quick inventory interactions.
const INVENTORY_STALE_TIME_MS = 30_000;

export const developmentItemsInventoryQueryKey = ({
  assetType,
  pageSize,
  pageToken,
  query,
  scope,
  source,
}: {
  assetType: DevelopmentItemsAssetTypeSelection;
  pageSize: number;
  pageToken?: string;
  query: string;
  scope?: CreatorInventoryScope;
  source: DevelopmentItemsSourceSelection;
}) => [
  ...DEVELOPMENT_ITEMS_INVENTORY_QUERY_KEY,
  scope?.type,
  scope?.id,
  assetType,
  source,
  query,
  pageSize,
  pageToken,
];

const useDevelopmentItemsInventory = ({
  assetType,
  pageSize,
  pageToken,
  query,
  scope,
  source,
}: {
  assetType: DevelopmentItemsAssetTypeSelection;
  pageSize: number;
  pageToken?: string;
  query: string;
  scope?: CreatorInventoryScope;
  source: DevelopmentItemsSourceSelection;
}) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: developmentItemsInventoryQueryKey({
      assetType,
      pageSize,
      pageToken,
      query: query.trim(),
      scope,
      source,
    }),
    queryFn: async ({ signal }) => {
      if (scope == null) {
        throw new Error('A creator scope is required to load inventory.');
      }

      const response = await creatorInventoryClient.creatorInventorySearchCreatorInventoryItems(
        {
          query: query.trim(),
          filter: buildCreatorInventorySearchFilter(scope, assetType, source),
          maxPageSize: pageSize,
          pageToken,
        },
        { signal },
      );

      const responseItems = response.items ?? [];
      const serverMetadataByAssetId = new Map<
        number,
        { description?: string | null; name?: string }
      >();
      const items = responseItems.flatMap((item) => {
        const mappedItem = mapCreatorInventoryItem(item);
        if (mappedItem != null) {
          serverMetadataByAssetId.set(mappedItem.assetId, {
            description: item.assetItem?.asset?.description,
            name: item.assetItem?.asset?.displayName,
          });
        }
        return mappedItem == null ? [] : [mappedItem];
      });

      return {
        items: reconcileDevelopmentItemsInventoryMetadata(
          queryClient,
          items,
          serverMetadataByAssetId,
        ),
        nextPageToken: response.nextPageToken,
      };
    },
    enabled: scope != null,
    placeholderData: keepPreviousData,
    staleTime: INVENTORY_STALE_TIME_MS,
  });
};

export { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS };
export default useDevelopmentItemsInventory;
