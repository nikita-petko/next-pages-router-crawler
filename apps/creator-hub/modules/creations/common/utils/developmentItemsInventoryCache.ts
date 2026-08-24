import type { QueryClient } from '@tanstack/react-query';
import {
  CreatorInventorySourceType,
  type CreatorInventoryAssetType,
  type CreatorInventoryScope,
} from '@modules/clients/creatorInventory';

type CachedDevelopmentItem = {
  assetId: number;
  name: string;
  updated?: Date;
};

type CachedDevelopmentItemsPage = {
  items: CachedDevelopmentItem[];
  nextPageToken?: string;
};

type CachedDevelopmentItemsInventorySource = Exclude<
  CreatorInventorySourceType,
  typeof CreatorInventorySourceType.Invalid
>;

type CachedDevelopmentItemsInventoryItem = CachedDevelopmentItem & {
  assetType?: CreatorInventoryAssetType;
  created?: Date;
  id: string;
  isPackage: boolean;
  sources: CachedDevelopmentItemsInventorySource[];
  state?: 'Active' | 'Archived';
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

type OptimisticUploadedDevelopmentItem = {
  expiresAt: number;
  item: CachedDevelopmentItemsInventoryItem & {
    assetType: CreatorInventoryAssetType;
    created: Date;
    state: 'Active';
    updated: Date;
  };
  scope: CreatorInventoryScope;
};

type OptimisticUploadedDevelopmentItemsByAssetId = ReadonlyMap<
  number,
  OptimisticUploadedDevelopmentItem
>;

export const DEVELOPMENT_ITEMS_INVENTORY_QUERY_KEY = ['development-items-inventory'] as const;
export const DEVELOPMENT_ITEM_METADATA_OVERRIDES_QUERY_KEY = [
  'development-item-metadata-overrides',
] as const;
export const DEVELOPMENT_ITEM_UPLOAD_OVERRIDES_QUERY_KEY = [
  'development-item-upload-overrides',
] as const;
export const DEVELOPMENT_ITEM_METADATA_OVERRIDE_TTL_MS = 30_000;
export const DEVELOPMENT_ITEM_UPLOAD_OVERRIDE_TTL_MS = 5 * 60_000;

const normalizeDescription = (description: string | null | undefined): string => description ?? '';
const normalizeName = (name: string | undefined): string => name?.trim() ?? '';
const ALL_INVENTORY_SOURCES = 'All';

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

const removeDevelopmentItemUploadOverride = (queryClient: QueryClient, assetId: number): void => {
  queryClient.setQueryData<OptimisticUploadedDevelopmentItemsByAssetId>(
    DEVELOPMENT_ITEM_UPLOAD_OVERRIDES_QUERY_KEY,
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

const isUploadedItemVisibleForInventory = (
  upload: OptimisticUploadedDevelopmentItem,
  {
    assetType,
    pageToken,
    query,
    scope,
    source,
  }: {
    assetType: CreatorInventoryAssetType;
    pageToken?: string;
    query: string;
    scope?: CreatorInventoryScope;
    source: string;
  },
): boolean =>
  pageToken == null &&
  scope?.type === upload.scope.type &&
  scope.id === upload.scope.id &&
  assetType === upload.item.assetType &&
  (source === CreatorInventorySourceType.Created || source === ALL_INVENTORY_SOURCES) &&
  upload.item.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());

const isUploadedItemVisibleForInventoryQuery = (
  upload: OptimisticUploadedDevelopmentItem,
  queryKey: readonly unknown[],
): boolean => {
  const [, scopeType, scopeId, assetType, source, query, , pageToken] = queryKey;
  return (
    queryKey[0] === DEVELOPMENT_ITEMS_INVENTORY_QUERY_KEY[0] &&
    scopeType === upload.scope.type &&
    scopeId === upload.scope.id &&
    assetType === upload.item.assetType &&
    (source === CreatorInventorySourceType.Created || source === ALL_INVENTORY_SOURCES) &&
    typeof query === 'string' &&
    pageToken == null &&
    upload.item.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())
  );
};

export const cacheDevelopmentItemUpload = (
  queryClient: QueryClient,
  {
    assetId,
    assetType,
    name,
    scope,
  }: {
    assetId: number;
    assetType: CreatorInventoryAssetType;
    name: string;
    scope: CreatorInventoryScope;
  },
): void => {
  const uploadedAt = new Date();
  const upload: OptimisticUploadedDevelopmentItem = {
    expiresAt: uploadedAt.getTime() + DEVELOPMENT_ITEM_UPLOAD_OVERRIDE_TTL_MS,
    item: {
      assetId,
      assetType,
      created: uploadedAt,
      id: assetId.toString(),
      isPackage: false,
      name,
      sources: [CreatorInventorySourceType.Created],
      state: 'Active',
      updated: uploadedAt,
    },
    scope,
  };

  queryClient.setQueryData<OptimisticUploadedDevelopmentItemsByAssetId>(
    DEVELOPMENT_ITEM_UPLOAD_OVERRIDES_QUERY_KEY,
    (currentOverrides) => {
      const nextOverrides = new Map(currentOverrides);
      nextOverrides.set(assetId, upload);
      return nextOverrides;
    },
  );

  queryClient.setQueriesData<CachedDevelopmentItemsPage>(
    {
      predicate: ({ queryKey }) => isUploadedItemVisibleForInventoryQuery(upload, queryKey),
    },
    (cachedPage) => {
      if (
        cachedPage == null ||
        cachedPage.items.some((cachedItem) => cachedItem.assetId === assetId)
      ) {
        return cachedPage;
      }

      return {
        ...cachedPage,
        items: [upload.item, ...cachedPage.items],
      };
    },
  );

  void queryClient.invalidateQueries({
    queryKey: DEVELOPMENT_ITEMS_INVENTORY_QUERY_KEY,
    refetchType: 'none',
  });

  if (typeof window !== 'undefined') {
    window.setTimeout(() => {
      const currentUpload = queryClient
        .getQueryData<OptimisticUploadedDevelopmentItemsByAssetId>(
          DEVELOPMENT_ITEM_UPLOAD_OVERRIDES_QUERY_KEY,
        )
        ?.get(assetId);
      if (currentUpload?.expiresAt !== upload.expiresAt) {
        return;
      }

      removeDevelopmentItemUploadOverride(queryClient, assetId);
      void queryClient.invalidateQueries({
        queryKey: DEVELOPMENT_ITEMS_INVENTORY_QUERY_KEY,
        refetchType: 'active',
      });
    }, DEVELOPMENT_ITEM_UPLOAD_OVERRIDE_TTL_MS);
  }
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

export const reconcileDevelopmentItemsInventoryUploads = (
  queryClient: QueryClient,
  items: readonly CachedDevelopmentItemsInventoryItem[],
  {
    assetType,
    pageToken,
    query,
    scope,
    source,
  }: {
    assetType: CreatorInventoryAssetType;
    pageToken?: string;
    query: string;
    scope?: CreatorInventoryScope;
    source: string;
  },
): CachedDevelopmentItemsInventoryItem[] => {
  const uploads = queryClient.getQueryData<OptimisticUploadedDevelopmentItemsByAssetId>(
    DEVELOPMENT_ITEM_UPLOAD_OVERRIDES_QUERY_KEY,
  );
  if (uploads == null || uploads.size === 0) {
    return [...items];
  }

  const existingAssetIds = new Set(items.map((item) => item.assetId));
  const optimisticItems: CachedDevelopmentItemsInventoryItem[] = [];
  uploads.forEach((upload, assetId) => {
    if (upload.expiresAt <= Date.now()) {
      removeDevelopmentItemUploadOverride(queryClient, assetId);
      return;
    }
    if (
      !isUploadedItemVisibleForInventory(upload, {
        assetType,
        pageToken,
        query,
        scope,
        source,
      })
    ) {
      return;
    }
    if (existingAssetIds.has(assetId)) {
      removeDevelopmentItemUploadOverride(queryClient, assetId);
      return;
    }

    optimisticItems.push(upload.item);
  });

  optimisticItems.sort(
    (left, right) => (right.updated?.getTime() ?? 0) - (left.updated?.getTime() ?? 0),
  );
  return [...optimisticItems, ...items];
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
