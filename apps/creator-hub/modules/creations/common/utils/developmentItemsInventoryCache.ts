import type { QueryClient } from '@tanstack/react-query';

type CachedDevelopmentItem = {
  assetId: number;
  name: string;
  updated?: Date;
};

type CachedDevelopmentItemsPage = {
  items: CachedDevelopmentItem[];
  nextPageToken?: string;
};

type DevelopmentItemServerMetadata = {
  description?: string | null;
  name?: string;
};

type OptimisticDevelopmentItemMetadata = {
  assetId: number;
  description: string;
  developConfirmed: boolean;
  expiresAt: number;
  inventoryConfirmed: boolean;
  name: string;
  updated: Date;
};

type OptimisticDevelopmentItemMetadataByAssetId = ReadonlyMap<
  number,
  OptimisticDevelopmentItemMetadata
>;

export const DEVELOPMENT_ITEMS_INVENTORY_QUERY_KEY = ['development-items-inventory'] as const;
export const DEVELOPMENT_ITEM_METADATA_OVERRIDES_QUERY_KEY = [
  'development-item-metadata-overrides',
] as const;
export const DEVELOPMENT_ITEM_METADATA_OVERRIDE_TTL_MS = 30_000;

const normalizeDescription = (description: string | null | undefined): string => description ?? '';
const normalizeName = (name: string | undefined): string => name?.trim() ?? '';

const removeDevelopmentItemMetadataOverride = (queryClient: QueryClient, assetId: number): void => {
  queryClient.setQueryData<OptimisticDevelopmentItemMetadataByAssetId>(
    DEVELOPMENT_ITEM_METADATA_OVERRIDES_QUERY_KEY,
    (currentOverrides) => {
      if (currentOverrides?.has(assetId) !== true) {
        return currentOverrides;
      }

      const nextOverrides = new Map(currentOverrides);
      nextOverrides.delete(assetId);
      return nextOverrides;
    },
  );
};

const getDevelopmentItemMetadataOverride = (
  queryClient: QueryClient,
  assetId: number,
): OptimisticDevelopmentItemMetadata | undefined => {
  const override = queryClient
    .getQueryData<OptimisticDevelopmentItemMetadataByAssetId>(
      DEVELOPMENT_ITEM_METADATA_OVERRIDES_QUERY_KEY,
    )
    ?.get(assetId);

  if (override != null && override.expiresAt <= Date.now()) {
    removeDevelopmentItemMetadataOverride(queryClient, assetId);
    return undefined;
  }

  return override;
};

const confirmDevelopmentItemMetadata = (
  queryClient: QueryClient,
  assetId: number,
  source: 'develop' | 'inventory',
): void => {
  queryClient.setQueryData<OptimisticDevelopmentItemMetadataByAssetId>(
    DEVELOPMENT_ITEM_METADATA_OVERRIDES_QUERY_KEY,
    (currentOverrides) => {
      const currentOverride = currentOverrides?.get(assetId);
      if (currentOverride == null) {
        return currentOverrides;
      }

      const confirmedOverride = {
        ...currentOverride,
        developConfirmed: source === 'develop' || currentOverride.developConfirmed,
        inventoryConfirmed: source === 'inventory' || currentOverride.inventoryConfirmed,
      };
      const nextOverrides = new Map(currentOverrides);
      if (confirmedOverride.developConfirmed && confirmedOverride.inventoryConfirmed) {
        nextOverrides.delete(assetId);
      } else {
        nextOverrides.set(assetId, confirmedOverride);
      }
      return nextOverrides;
    },
  );
};

const doesServerMetadataMatch = (
  override: OptimisticDevelopmentItemMetadata,
  serverMetadata: DevelopmentItemServerMetadata | undefined,
): boolean =>
  normalizeName(serverMetadata?.name) === normalizeName(override.name) &&
  normalizeDescription(serverMetadata?.description) === normalizeDescription(override.description);

export const cacheDevelopmentItemMetadataUpdate = (
  queryClient: QueryClient,
  {
    assetId,
    description,
    name,
  }: {
    assetId: number;
    description: string;
    name: string;
  },
): void => {
  const updated = new Date();
  const override: OptimisticDevelopmentItemMetadata = {
    assetId,
    description: normalizeDescription(description),
    developConfirmed: false,
    expiresAt: updated.getTime() + DEVELOPMENT_ITEM_METADATA_OVERRIDE_TTL_MS,
    inventoryConfirmed: false,
    name,
    updated,
  };

  queryClient.setQueryData<OptimisticDevelopmentItemMetadataByAssetId>(
    DEVELOPMENT_ITEM_METADATA_OVERRIDES_QUERY_KEY,
    (currentOverrides) => {
      const nextOverrides = new Map(currentOverrides);
      nextOverrides.set(assetId, override);
      return nextOverrides;
    },
  );

  queryClient.setQueriesData<CachedDevelopmentItemsPage>(
    { queryKey: DEVELOPMENT_ITEMS_INVENTORY_QUERY_KEY },
    (cachedPage) => {
      const updatedItem = cachedPage?.items.find((item) => item.assetId === assetId);
      if (cachedPage == null || updatedItem == null) {
        return cachedPage;
      }

      return {
        ...cachedPage,
        items: [
          {
            ...updatedItem,
            name,
            updated,
          },
          ...cachedPage.items.filter((item) => item.assetId !== assetId),
        ],
      };
    },
  );

  void queryClient.invalidateQueries({
    queryKey: DEVELOPMENT_ITEMS_INVENTORY_QUERY_KEY,
    refetchType: 'active',
  });

  if (typeof window !== 'undefined') {
    window.setTimeout(() => {
      const currentOverride = getDevelopmentItemMetadataOverride(queryClient, assetId);
      if (currentOverride?.expiresAt !== override.expiresAt) {
        return;
      }

      removeDevelopmentItemMetadataOverride(queryClient, assetId);
      void queryClient.invalidateQueries({
        queryKey: DEVELOPMENT_ITEMS_INVENTORY_QUERY_KEY,
        refetchType: 'active',
      });
    }, DEVELOPMENT_ITEM_METADATA_OVERRIDE_TTL_MS);
  }
};

export const reconcileDevelopmentItemsInventoryMetadata = <TItem extends CachedDevelopmentItem>(
  queryClient: QueryClient,
  items: readonly TItem[],
  serverMetadataByAssetId: ReadonlyMap<number, DevelopmentItemServerMetadata>,
): TItem[] => {
  const optimisticItems: TItem[] = [];
  const serverItems: TItem[] = [];

  items.forEach((item) => {
    const override = getDevelopmentItemMetadataOverride(queryClient, item.assetId);
    if (override == null) {
      serverItems.push(item);
      return;
    }

    if (doesServerMetadataMatch(override, serverMetadataByAssetId.get(item.assetId))) {
      confirmDevelopmentItemMetadata(queryClient, item.assetId, 'inventory');
      serverItems.push(item);
      return;
    }

    optimisticItems.push({
      ...item,
      name: override.name,
      updated: override.updated,
    });
  });

  optimisticItems.sort(
    (left, right) => (right.updated?.getTime() ?? 0) - (left.updated?.getTime() ?? 0),
  );
  return [...optimisticItems, ...serverItems];
};

export const reconcileDeveloperItemDetailsMetadata = <
  TDetails extends { description?: string; name: string },
>(
  queryClient: QueryClient,
  assetId: number,
  details: TDetails,
): { details: TDetails; expiresAt?: number } => {
  const override = getDevelopmentItemMetadataOverride(queryClient, assetId);
  if (override == null) {
    return { details };
  }

  if (doesServerMetadataMatch(override, details)) {
    confirmDevelopmentItemMetadata(queryClient, assetId, 'develop');
    return { details };
  }

  return {
    details: {
      ...details,
      description: override.description,
      name: override.name,
    },
    expiresAt: override.expiresAt,
  };
};
