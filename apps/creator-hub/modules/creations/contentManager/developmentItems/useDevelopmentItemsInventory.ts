import { keepPreviousData, useQuery } from '@tanstack/react-query';
import creatorInventoryClient from '@modules/clients/creatorInventory';
import type { CreatorInventoryScope } from '@modules/clients/creatorInventory';
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
  'development-items-inventory',
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
}) =>
  useQuery({
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

      return {
        items: (response.items ?? []).flatMap((item) => {
          const mappedItem = mapCreatorInventoryItem(item);
          return mappedItem == null ? [] : [mappedItem];
        }),
        nextPageToken: response.nextPageToken,
      };
    },
    enabled: scope != null,
    placeholderData: keepPreviousData,
    staleTime: INVENTORY_STALE_TIME_MS,
  });

export { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS };
export default useDevelopmentItemsInventory;
