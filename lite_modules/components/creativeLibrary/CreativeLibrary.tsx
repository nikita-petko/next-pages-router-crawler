import {
  AdAssetType,
  type ContentModerationStatus,
  type EnrichedAdCreativeAsset,
} from '@rbx/client-ads-management-api/v1';
import {
  Button,
  Checkbox,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogTitle,
  Divider,
  Icon,
  IconButton,
  SegmentedControl,
  SheetActions,
  SheetBody,
  SheetContent,
  SheetRoot,
  SheetTitle,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  TextInput,
} from '@rbx/foundation-ui';
import { useLocalization } from '@rbx/intl';
import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query';
import {
  type Dispatch,
  Fragment,
  type KeyboardEvent,
  type ReactNode,
  type SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  MAX_ASSET_DISPLAY_NAME_LENGTH,
  sanitizeAssetDisplayName,
  updateAssetDisplayName,
} from '@clients/assetsUpload';
import { EventName, logNativeImpressionEvent } from '@clients/unifiedLogger';
import CenteredCircularProgress from '@components/common/CenteredCircularProgress';
import AiCreateDrawer from '@components/common/creative/AiCreateDrawer';
import GameUniverseDropdown from '@components/common/creative/GameUniverseDropdown';
import TileMediaOverflowMenu from '@components/common/creative/TileMediaOverflowMenu';
import DismissibleTooltip from '@components/common/DismissibleTooltip';
import FoundationTablePagination from '@components/common/FoundationTablePagination';
import GenericSnackBar from '@components/common/GenericSnackBar';
import AssetStatusBadge, {
  getAssetStatusDotColorClass,
} from '@components/creativeLibrary/AssetStatusBadge';
import AssetThumbnail from '@components/creativeLibrary/AssetThumbnail';
import tileGridStyles from '@components/creativeLibrary/CreativeLibrary.module.css';
import CreativeLibraryFilterDrawer, {
  type MediaTypeCheckboxValue,
  type SourceCheckboxValue,
  type StatusCheckboxValue,
} from '@components/creativeLibrary/CreativeLibraryFilterDrawer';
import UploadCreativesDrawer from '@components/creativeLibrary/UploadCreativesDrawer';
import { AI_CREATE_GENERATE_ICON } from '@constants/aiCreatives';
import {
  EXPERIENCE_FILTER_ALL,
  MEDIA_TYPE_FILTER,
  STATUS_FILTER,
  VIEW_MODE,
  type ViewMode,
} from '@constants/creativeLibrary';
import { UNAVAILABLE_VALUE_DISPLAY } from '@constants/displayConstants';
import { TranslationNamespace } from '@constants/localization';
import { Tooltips } from '@constants/tooltips';
import useAdAccountAutoCreateCreateAction from '@hooks/account/useAdAccountAutoCreateCreateAction';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import useUniverseOptionsForAdCreation from '@hooks/useUniverseOptionsForAdCreation';
import {
  deleteAdCreative,
  getAdCreatives,
  updateAdCreative,
} from '@services/ads/adCreativeAssetService';
import { AppStoreType, useAppStore } from '@stores/appStoreProvider';
import { AdAsset } from '@type/adAsset';
import { getHttpStatusFromError } from '@type/errorResponse';
import { type AdvertisedUniverse } from '@type/universe';

/**
 * Default page size for the table view. Matches the smallest
 * `rowsPerPageOptions` value exposed by `TableFooter` (10) so the initial
 * render is consistent with what the user sees in the dropdown.
 */
const DEFAULT_ROWS_PER_PAGE = 10;

/**
 * Page size for the tile (thumbnail) view. The tile view paginates with the
 * same `TableFooter` control the list view uses, defaulting to 200 tiles per
 * page so the user gets a large, scannable grid while still capping how much
 * is committed to the DOM at once. 200 is one of `TableFooter`'s
 * `rowsPerPageOptions`, so the user can still step down via the same selector.
 */
const TILE_PAGE_SIZE = 200;

/**
 * Asset-registry (`getAdCreatives`) fetch resilience. The list endpoint is a
 * full server-side cursor-chase, and this page intentionally runs it with
 * `staleTime: 0` so navigating in always reflects the latest moderation status.
 * The downside is volume: React Query's default `refetchOnWindowFocus` re-ran
 * the whole chase on every alt-tab, and a load-shedding registry (503/429) was
 * retried on RQ's default cadence — together hammering the registry (the "called
 * way too often" report). We cap retries, skip terminal client errors, and space
 * attempts with exponential backoff + jitter; `refetchOnWindowFocus` is disabled
 * per-query below so refocus no longer triggers a fresh chase (mount/navigation
 * still does, preserving the fresh-on-entry behavior).
 */
// 5 attempts on a 5s base, doubling and capped at 60s, gives a backoff schedule
// of roughly 5s → 10s → 20s → 40s → 60s (pre-jitter), i.e. ~2.3 min of total
// backoff before giving up — spaced far enough apart to ride out a sustained
// registry brownout without piling on requests.
const ASSET_REGISTRY_MAX_RETRIES = 5;
const ASSET_REGISTRY_RETRY_BASE_MS = 5_000;
const ASSET_REGISTRY_RETRY_CAP_MS = 60_000;

// Terminal client errors (400/401/403/404, …) won't change on retry. 408/425/429
// are transient timeout / rate-limit signals, so they stay retryable.
export const isTerminalRegistryStatus = (status: number): boolean =>
  status >= 400 && status < 500 && ![408, 425, 429].includes(status);

export const shouldRetryAssetRegistry = (failureCount: number, error: unknown): boolean => {
  const status = getHttpStatusFromError(error);
  if (status !== undefined && isTerminalRegistryStatus(status)) {
    return false;
  }
  return failureCount < ASSET_REGISTRY_MAX_RETRIES;
};

// Exponential backoff (5s, 10s, 20s, …) capped at 60s with full jitter, so a
// burst of failed fetches doesn't retry in lockstep and re-spike the registry.
export const assetRegistryRetryDelayMs = (attemptIndex: number): number => {
  const expo = Math.min(
    ASSET_REGISTRY_RETRY_CAP_MS,
    ASSET_REGISTRY_RETRY_BASE_MS * 2 ** attemptIndex,
  );
  return Math.round(expo / 2 + Math.random() * (expo / 2));
};

type BulkFlowFailedAsset = Readonly<{
  /** Ad-manager creative primary key (`AdAsset.adAssetId`); retained for React keys / retry bookkeeping. */
  adAssetId: string;
  /** Roblox numeric asset identifier (`AdAsset.assetId`), same field as Asset ID in the drawer / list subtitle. */
  assetId: string;
  assetName: string;
}>;

/** Shared orchestration for assign/archive bulk flows (`Promise.allSettled`, partial success, cache refresh). */
type BulkFlowOptions<T extends { adAssetId: string }> = Readonly<{
  invalidateQueries: () => Promise<void> | void;
  onAllSucceeded: () => void;
  partialSuccessToast: (succeededCount: number, totalCount: number) => void;
  performAction: (target: T) => Promise<unknown>;
  setFailedAssets: (failed: BulkFlowFailedAsset[]) => void;
  setHasError: (hasError: boolean) => void;
  targets: ReadonlyArray<T>;
  toFailedAsset: (target: T) => BulkFlowFailedAsset;
}>;

const runBulkFlow = async <T extends { adAssetId: string }>(
  opts: BulkFlowOptions<T>,
  setSelectedAssetIds: Dispatch<SetStateAction<Set<string>>>,
): Promise<void> => {
  const {
    invalidateQueries,
    onAllSucceeded,
    partialSuccessToast,
    performAction,
    setFailedAssets,
    setHasError,
    targets,
    toFailedAsset,
  } = opts;

  const settled = await Promise.allSettled(targets.map(performAction));

  const failedAssets: BulkFlowFailedAsset[] = [];
  settled.forEach((result, index) => {
    if (result.status === 'rejected') {
      failedAssets.push(toFailedAsset(targets[index]));
    }
  });

  const successCount = targets.length - failedAssets.length;

  if (successCount > 0) {
    await invalidateQueries();
  }

  const totalCount = targets.length;
  const failedLen = failedAssets.length;

  if (failedLen === totalCount) {
    setFailedAssets(failedAssets);
    setHasError(true);
    return;
  }

  if (failedLen > 0) {
    setSelectedAssetIds((prev) => {
      const next = new Set(prev);
      targets.forEach((target, index) => {
        if (settled[index]?.status === 'fulfilled') {
          next.delete(target.adAssetId);
        }
      });
      return next;
    });
    setFailedAssets(failedAssets);
    setHasError(true);
    partialSuccessToast(successCount, totalCount);
    return;
  }

  onAllSucceeded();
};

// AMA's list endpoint takes a single `is_archived` flag (live xor
// archived), so to support combinations like "Approved + Archived" we
// run two parallel queries and merge them client-side. Each helper
// gates one query: live is fetched whenever no status filter is set
// or any non-Archived status is selected; archived only when the
// Archived checkbox is selected.
const needsLiveBucket = (statuses: ReadonlySet<StatusCheckboxValue>): boolean =>
  statuses.size === 0 || [...statuses].some((status) => status !== STATUS_FILTER.ARCHIVED);

const needsArchivedBucket = (statuses: ReadonlySet<StatusCheckboxValue>): boolean =>
  statuses.has(STATUS_FILTER.ARCHIVED);

// `VIDEO` groups both `VIDEO` and `ADS_VIDEO` since they render identically
// and the user thinks of them as one category. Empty set = no filter.
const matchesMediaTypeFilter = (
  assetType: string,
  filters: ReadonlySet<MediaTypeCheckboxValue>,
): boolean => {
  if (filters.size === 0) {
    return true;
  }
  if (filters.has(MEDIA_TYPE_FILTER.IMAGE) && assetType === AdAssetType.AdAssetTypeImage) {
    return true;
  }
  if (filters.has(MEDIA_TYPE_FILTER.MODEL) && assetType === AdAssetType.AdAssetTypeModel) {
    return true;
  }
  if (
    filters.has(MEDIA_TYPE_FILTER.VIDEO) &&
    (assetType === AdAssetType.AdAssetTypeVideo || assetType === AdAssetType.AdAssetTypeAdsVideo)
  ) {
    return true;
  }
  return false;
};

// Status check for the merged live + archived asset list.
// - No status filter set: hide archived (mirrors the wire-level default
//   of `is_archived=false`).
// - Archived asset: passes iff Archived is selected.
// - Live asset: passes iff the filter set contains the asset's
//   moderation status. `ReadonlySet<string>` cast lets us check
//   membership without unsafely widening the wire-level enum string.
const matchesStatusFilter = (
  asset: AdAsset,
  filterStatuses: ReadonlySet<StatusCheckboxValue>,
): boolean => {
  if (filterStatuses.size === 0) {
    return !asset.isArchived;
  }
  if (asset.isArchived) {
    return filterStatuses.has(STATUS_FILTER.ARCHIVED);
  }
  const statuses: ReadonlySet<string> = filterStatuses;
  return statuses.has(asset.contentModerationStatus);
};

// Client-side filter for the merged live + archived asset list.
const applyFilters = (
  assets: AdAsset[],
  filters: {
    filterExperience: string;
    filterMediaTypes: ReadonlySet<MediaTypeCheckboxValue>;
    filterSources: ReadonlySet<SourceCheckboxValue>;
    filterStatuses: ReadonlySet<StatusCheckboxValue>;
    searchTerm: string;
  },
): AdAsset[] => {
  const { filterExperience, filterMediaTypes, filterSources, filterStatuses, searchTerm } = filters;
  const sourceFilter: ReadonlySet<string> = filterSources;
  const normalizedSearch = searchTerm.trim().toLocaleLowerCase();
  return assets.filter((asset) => {
    if (!matchesMediaTypeFilter(asset.assetType, filterMediaTypes)) {
      return false;
    }
    if (!matchesStatusFilter(asset, filterStatuses)) {
      return false;
    }
    if (sourceFilter.size > 0 && !sourceFilter.has(asset.source)) {
      return false;
    }
    if (
      filterExperience !== EXPERIENCE_FILTER_ALL &&
      String(asset.experienceId ?? '') !== filterExperience
    ) {
      return false;
    }
    if (normalizedSearch !== '') {
      const matchesName = asset.assetName.toLocaleLowerCase().includes(normalizedSearch);
      const matchesAssetId = String(asset.assetId).startsWith(normalizedSearch);
      if (!matchesName && !matchesAssetId) {
        return false;
      }
    }
    return true;
  });
};

const getStatusDotColorClass = (asset: AdAsset): string =>
  getAssetStatusDotColorClass(asset.isArchived, asset.contentModerationStatus);

const getUniversesWithSelectedUniverse = (
  universes: ReadonlyArray<AdvertisedUniverse>,
  selectedUniverseId: number | null,
  selectedUniverseLabel: string,
): AdvertisedUniverse[] => {
  if (
    selectedUniverseId == null ||
    universes.some((universe) => universe.universe_id === selectedUniverseId)
  ) {
    return [...universes];
  }

  return [
    ...universes,
    {
      universe_id: selectedUniverseId,
      universe_name: selectedUniverseLabel,
    },
  ];
};

/**
 * Maps the generated `EnrichedAdCreativeAsset` (camelCase, with every field
 * typed as optional by the OpenAPI generator) into the UI-facing
 * {@link AdAsset} shape. Fields not returned by the backend (experience
 * name, thumbnail URL) are stubbed and resolved client-side.
 */
const toAdAsset = (raw: EnrichedAdCreativeAsset): AdAsset => ({
  adAccountId: raw.adAccountId ?? '',
  adAssetId: raw.id ?? '',
  assetId: raw.assetId ?? 0,
  assetName: raw.assetName ?? '',
  assetType: raw.assetType ?? '',
  // Preserve unknown/missing backend moderation states as "unknown" so the UI
  // doesn't incorrectly show the "In review" badge for missing data.
  contentModerationStatus:
    raw.contentModerationStatus ?? ('unknown' as unknown as ContentModerationStatus),
  createdAt: raw.createdTimestampMs ? new Date(raw.createdTimestampMs).toISOString() : '',
  durationMs: raw.durationMs ?? null,
  experienceId: raw.universeId ?? null,
  experienceName: null,
  height: raw.height ?? null,
  isArchived: raw.isArchived ?? false,
  source: raw.source ?? '',
  thumbnailUrl: null,
  updatedAt: raw.updatedTimestampMs ? new Date(raw.updatedTimestampMs).toISOString() : '',
  width: raw.width ?? null,
});

const CreativeLibrary = () => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.CreativeLibrary);
  const { translate: translateForecast } = useNamespacedTranslation(TranslationNamespace.Forecast);
  const { translate: translateMisc } = useNamespacedTranslation(TranslationNamespace.Misc);
  const { translate: translateReport } = useNamespacedTranslation(TranslationNamespace.Report);
  const { locale } = useLocalization();
  const queryClient = useQueryClient();

  useEffect(() => {
    logNativeImpressionEvent(EventName.CreativeLibraryOpened, {
      context: 'library_page',
    });
  }, []);

  // Cached short-date formatter for the table's Date Added column. Memoized
  // so we don't allocate a new `Intl.DateTimeFormat` per row render. Falls back
  // to the browser default when `locale` is not yet hydrated.
  const dateAddedFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale || 'en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
    [locale],
  );

  const [viewMode, setViewMode] = useState<ViewMode>(VIEW_MODE.TILE);
  const [filterMediaTypes, setFilterMediaTypes] = useState<Set<MediaTypeCheckboxValue>>(
    () => new Set(),
  );
  const [filterExperience, setFilterExperience] = useState<string>(EXPERIENCE_FILTER_ALL);
  const [filterStatuses, setFilterStatuses] = useState<Set<StatusCheckboxValue>>(() => new Set());
  const [filterSources, setFilterSources] = useState<Set<SourceCheckboxValue>>(() => new Set());
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedAsset, setSelectedAsset] = useState<AdAsset | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState<boolean>(false);
  const [uploadDrawerOpen, setUploadDrawerOpen] = useState<boolean>(false);
  const [aiCreateDrawerOpen, setAiCreateDrawerOpen] = useState<boolean>(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState<boolean>(false);

  // Asset queued for the delete-confirmation dialog. Held separately from
  // `selectedAsset` so the user can trigger delete from a tile/row menu
  // without first opening the detail sheet, and so the dialog has an
  // explicit close lifecycle independent of the sheet.
  const [assetPendingDelete, setAssetPendingDelete] = useState<AdAsset | null>(null);

  // Pending universe edit for the detail sheet's Experience picker:
  // - undefined: no in-flight edit; mirror saved value
  // - number: set that universe
  // - null: clear universe
  const [pendingUniverseId, setPendingUniverseId] = useState<number | null | undefined>(undefined);

  // Pending asset-name edit for the detail sheet. undefined mirrors saved value.
  const [pendingAssetName, setPendingAssetName] = useState<string | undefined>(undefined);

  // Local toast state. We don't have a creative-library toast slice in
  // the global toast store yet, and this surface only needs two
  // single-shot messages (save / delete success/failure), so keep it
  // local rather than adding a new zustand slice for two booleans.
  const [toast, setToast] = useState<{
    message: string;
    severity: 'error' | 'success';
  } | null>(null);

  const adAccountId = useAppStore((state: AppStoreType) => state.appData.adAccountInfo?.id);
  const isGenAiCreativesEnabled = useAppStore(
    (state: AppStoreType) => state.appMetadataState?.data?.isGenAiCreativesEnabled ?? false,
  );
  const {
    groupId: creativeLibraryGroupId,
    shouldWaitForWorkspace,
    universeOptions: advertisableUniverses,
  } = useUniverseOptionsForAdCreation();
  const openUploadDrawer = useAdAccountAutoCreateCreateAction(
    useCallback(() => {
      setUploadDrawerOpen(true);
    }, []),
    'creativeLibraryUpload',
  );
  const openAiCreateDrawer = useAdAccountAutoCreateCreateAction(
    useCallback(() => {
      setAiCreateDrawerOpen(true);
    }, []),
    'creativeLibraryAiCreate',
  );

  // Table-view pagination state. The tile view keeps its own independent
  // page / page-size below so switching views doesn't carry over a page
  // index that's only valid at the other view's page size.
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(DEFAULT_ROWS_PER_PAGE);
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(() => new Set());
  const [bulkAssignDialogOpen, setBulkAssignDialogOpen] = useState<boolean>(false);
  const [bulkArchiveDialogOpen, setBulkArchiveDialogOpen] = useState<boolean>(false);
  const [bulkAssignUniverseId, setBulkAssignUniverseId] = useState<number | null | undefined>(
    undefined,
  );
  const [bulkAssignPending, setBulkAssignPending] = useState<boolean>(false);
  const [bulkArchivePending, setBulkArchivePending] = useState<boolean>(false);
  const [bulkAssignHasError, setBulkAssignHasError] = useState<boolean>(false);
  const [bulkArchiveHasError, setBulkArchiveHasError] = useState<boolean>(false);
  const [bulkAssignFailedAssets, setBulkAssignFailedAssets] = useState<BulkFlowFailedAsset[]>([]);
  const [bulkArchiveFailedAssets, setBulkArchiveFailedAssets] = useState<BulkFlowFailedAsset[]>([]);

  // Tile-view pagination state. Mirrors the table view's page/page-size
  // pair but defaults to TILE_PAGE_SIZE (200) per page. Kept separate from
  // the table state so each view remembers its own position and the page
  // index is always interpreted at the right page size.
  const [tilePage, setTilePage] = useState<number>(0);
  const [tileRowsPerPage, setTileRowsPerPage] = useState<number>(TILE_PAGE_SIZE);

  // Silent clipboard write. Failures only happen in restricted contexts
  // (insecure origins, missing permissions), and there's nothing useful
  // for the user to act on.
  const copyAssetIdToClipboard = (assetId: number) => {
    navigator.clipboard?.writeText(String(assetId)).catch(() => {});
  };

  // AMA's list endpoint serves one bucket at a time (live xor archived),
  // so to support filter combinations like Approved + Archived we run
  // two parallel queries with stable per-bucket keys and merge them
  // client-side. Each `enabled` flag turns its bucket on or off based
  // on the current filter selection; cached data for a bucket the user
  // is no longer viewing is preserved so re-enabling shows it instantly
  // without re-fetching. Each query chases its own cursor server-side
  // and returns the full enriched set, so sorting / search / pagination
  // still runs entirely client-side (sound at the spec's data scale:
  // p99 = 98 entries, max 2,544 — same pattern as `GenericManagementTable`).
  const fetchLiveBucket = needsLiveBucket(filterStatuses);
  const fetchArchivedBucket = needsArchivedBucket(filterStatuses);
  const hasCreativeLibraryScope = creativeLibraryGroupId !== undefined || !!adAccountId;
  const getAdCreativesQueryKey = (isArchived: boolean) =>
    creativeLibraryGroupId === undefined
      ? ['adCreatives', adAccountId, isArchived]
      : ['adCreatives', adAccountId, creativeLibraryGroupId, isArchived];
  const fetchAdCreatives = (isArchived: boolean) =>
    creativeLibraryGroupId === undefined
      ? getAdCreatives(isArchived)
      : getAdCreatives(isArchived, { groupId: creativeLibraryGroupId });
  const updateAdCreativeForCurrentWorkspace = (
    id: string,
    updates: { universeId: number | null },
  ) =>
    creativeLibraryGroupId === undefined
      ? updateAdCreative(id, updates)
      : updateAdCreative(id, updates, { groupId: creativeLibraryGroupId });
  const deleteAdCreativeForCurrentWorkspace = (id: string) =>
    creativeLibraryGroupId === undefined
      ? deleteAdCreative(id)
      : deleteAdCreative(id, { groupId: creativeLibraryGroupId });
  // Opt out of the global staleTime: Infinity (set in _app.tsx) so
  // pending_review creatives don't get pinned to the cache for the
  // whole session — each page mount re-fetches and gets the latest
  // moderation status. The campaign-builder drawer's CreativeImportTab
  // shares these query keys and uses the same staleTime override so
  // both entry points stay in lockstep.
  const [liveQuery, archivedQuery] = useQueries({
    queries: [
      {
        enabled: hasCreativeLibraryScope && fetchLiveBucket && !shouldWaitForWorkspace,
        queryFn: () => fetchAdCreatives(false),
        queryKey: getAdCreativesQueryKey(false),
        refetchOnWindowFocus: false,
        retry: shouldRetryAssetRegistry,
        retryDelay: assetRegistryRetryDelayMs,
        staleTime: 0,
      },
      {
        enabled: hasCreativeLibraryScope && fetchArchivedBucket && !shouldWaitForWorkspace,
        queryFn: () => fetchAdCreatives(true),
        queryKey: getAdCreativesQueryKey(true),
        refetchOnWindowFocus: false,
        retry: shouldRetryAssetRegistry,
        retryDelay: assetRegistryRetryDelayMs,
        staleTime: 0,
      },
    ],
  });

  useEffect(() => {
    if (!liveQuery.isError) {
      return;
    }
    logNativeImpressionEvent(EventName.CreativeLibraryLoadFailed, {
      context: 'library_page',
      source: 'library_assets_live',
      statusCode: String(getHttpStatusFromError(liveQuery.error) ?? 'unknown'),
    });
  }, [liveQuery.error, liveQuery.isError]);

  useEffect(() => {
    if (!archivedQuery.isError) {
      return;
    }
    logNativeImpressionEvent(EventName.CreativeLibraryLoadFailed, {
      context: 'library_page',
      source: 'library_assets_archived',
      statusCode: String(getHttpStatusFromError(archivedQuery.error) ?? 'unknown'),
    });
  }, [archivedQuery.error, archivedQuery.isError]);

  const isLoading =
    (fetchLiveBucket && liveQuery.isLoading) || (fetchArchivedBucket && archivedQuery.isLoading);

  // Merge the two buckets into a single list keyed off the stable
  // `assets` reference for downstream memos. Each bucket is gated by
  // its `fetch*Bucket` flag so cached data from a bucket the user is
  // no longer viewing doesn't leak in; the gate is also part of the
  // dep list so toggling a status checkbox immediately recomputes.
  const assets: AdAsset[] = useMemo(() => {
    const live = fetchLiveBucket ? (liveQuery.data?.assets ?? []) : [];
    const archived = fetchArchivedBucket ? (archivedQuery.data?.assets ?? []) : [];
    return [...live, ...archived].map(toAdAsset);
  }, [fetchLiveBucket, fetchArchivedBucket, liveQuery.data, archivedQuery.data]);

  // Invalidate (not setQueryData): PATCH returns the bare AdCreativeAsset,
  // missing the enrichment fields the list is keyed on.
  const refetchAdCreatives = () => {
    const queryKey =
      creativeLibraryGroupId === undefined
        ? ['adCreatives', adAccountId]
        : ['adCreatives', adAccountId, creativeLibraryGroupId];
    return queryClient.invalidateQueries({ queryKey });
  };

  const saveDetailsMutation = useMutation({
    mutationFn: async ({
      assetId,
      displayName,
      id,
      universeId,
    }: {
      assetId: number;
      displayName?: string;
      id: string;
      universeId?: number | null;
    }) => {
      const tasks: Array<Promise<void>> = [];
      if (displayName != null) {
        tasks.push(updateAssetDisplayName(assetId, displayName));
      }
      if (universeId !== undefined) {
        tasks.push(updateAdCreativeForCurrentWorkspace(id, { universeId }));
      }
      await Promise.all(tasks);
    },
    onError: () => {
      setToast({ message: translate('Description.SaveCreativeFailed'), severity: 'error' });
    },
    onSuccess: async () => {
      await refetchAdCreatives();
      setToast({ message: translate('Description.SaveCreativeSuccess'), severity: 'success' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAdCreativeForCurrentWorkspace(id),
    onError: () => {
      setToast({ message: translate('Description.DeleteCreativeFailed'), severity: 'error' });
    },
    onSuccess: async () => {
      await refetchAdCreatives();
      setToast({ message: translate('Description.DeleteCreativeSuccess'), severity: 'success' });
    },
  });

  // Lookup table for the Game column. AMA only returns `universeId` per
  // creative, so we resolve the human-readable name from the same
  // advertised-universe data the filter dropdown is built from.
  // If the universe isn't in the user's advertisable set (e.g. they no
  // longer have access), the row falls back to the raw id so the column
  // is never blank.
  const universeNameById = useMemo(() => {
    const map = new Map<number, string>();
    advertisableUniverses.forEach((universe) => {
      map.set(universe.universe_id, universe.universe_name);
    });
    return map;
  }, [advertisableUniverses]);

  const getGameLabel = (universeId: number | null): string => {
    if (universeId == null) {
      return UNAVAILABLE_VALUE_DISPLAY;
    }
    return universeNameById.get(universeId) ?? String(universeId);
  };

  // Filtered set: drives both the table footer's `count` and the page
  // slice. Recomputes whenever any filter / search dimension changes,
  // which is cheap at this data scale.
  const filteredAssets = useMemo(
    () =>
      applyFilters(assets, {
        filterExperience,
        filterMediaTypes,
        filterSources,
        filterStatuses,
        searchTerm,
      }),
    [assets, filterExperience, filterMediaTypes, filterSources, filterStatuses, searchTerm],
  );

  // Sort by createdAt desc so newest uploads land at the top of the
  // library and existing rows keep their position when the user edits
  // them (sorting by updatedAt previously snapped a freshly-saved
  // creative to the top, which felt jarring during inline edits).
  const sortedAssets = useMemo(
    () =>
      [...filteredAssets].sort((a, b) => {
        const aTs = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTs = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTs - aTs;
      }),
    [filteredAssets],
  );

  // Reset both views' offsets whenever the *result set* changes (a new
  // filter or search term). Without this, the user can land on an empty
  // table page or scroll past tiles that no longer exist.
  useEffect(() => {
    setPage(0);
    setTilePage(0);
  }, [filterExperience, filterMediaTypes, filterSources, filterStatuses, searchTerm]);

  // Rows-per-page only affects the table view, so it only resets `page`.
  // Reset is needed because (e.g.) jumping from 10/page to 50/page with
  // page=2 selected would skip 100 rows of valid results.
  useEffect(() => {
    setPage(0);
  }, [rowsPerPage]);

  // Same clamp for the tile view's page size: changing tiles-per-page
  // returns the user to the first page of the regrouped grid.
  useEffect(() => {
    setTilePage(0);
  }, [tileRowsPerPage]);

  // Keep selection scoped to the visible result set after filter/search
  // changes so bulk actions never target stale, hidden ids.
  useEffect(() => {
    setSelectedAssetIds((current) => {
      const visibleIds = new Set(sortedAssets.map((asset) => asset.adAssetId));
      const next = new Set([...current].filter((id) => visibleIds.has(id)));
      return next.size === current.size ? current : next;
    });
  }, [sortedAssets]);

  // Defensive: if the active page falls past the end of the filtered
  // set (e.g. rows changed underneath us), clamp back to the last
  // available page. Mirrors the pattern in `GenericManagementTable`.
  useEffect(() => {
    const lastAvailablePage = Math.max(0, Math.ceil(sortedAssets.length / rowsPerPage) - 1);
    if (page > lastAvailablePage) {
      setPage(lastAvailablePage);
    }
  }, [page, rowsPerPage, sortedAssets.length]);

  // Same clamp for the tile view so a shrinking result set can't strand
  // the user on an empty trailing page.
  useEffect(() => {
    const lastAvailablePage = Math.max(0, Math.ceil(sortedAssets.length / tileRowsPerPage) - 1);
    if (tilePage > lastAvailablePage) {
      setTilePage(lastAvailablePage);
    }
  }, [tilePage, tileRowsPerPage, sortedAssets.length]);

  const tileVisibleAssets = useMemo(
    () =>
      sortedAssets.slice(tilePage * tileRowsPerPage, tilePage * tileRowsPerPage + tileRowsPerPage),
    [sortedAssets, tilePage, tileRowsPerPage],
  );

  // Count of dimensions with any selection (not options) so the badge stays
  // single-digit; search has its own input and is excluded.
  const activeFilterCount =
    (filterExperience !== EXPERIENCE_FILTER_ALL ? 1 : 0) +
    (filterMediaTypes.size > 0 ? 1 : 0) +
    (filterStatuses.size > 0 ? 1 : 0) +
    (filterSources.size > 0 ? 1 : 0);

  const handleApplyFilters = (next: {
    experience: string;
    mediaTypes: Set<MediaTypeCheckboxValue>;
    sources: Set<SourceCheckboxValue>;
    statuses: Set<StatusCheckboxValue>;
  }) => {
    setFilterExperience(next.experience);
    setFilterMediaTypes(next.mediaTypes);
    setFilterStatuses(next.statuses);
    setFilterSources(next.sources);
  };

  // Inline Reset filters next to the Filter-by button. Resets the four
  // filter dimensions and commits immediately (the drawer's Reset all
  // only clears the draft and still requires Apply; outside the drawer
  // there's no draft to commit). Search is intentionally untouched —
  // it has its own input and isn't part of `activeFilterCount`.
  const handleClearAllFilters = () => {
    setFilterExperience(EXPERIENCE_FILTER_ALL);
    setFilterMediaTypes(new Set());
    setFilterStatuses(new Set());
    setFilterSources(new Set());
  };

  const tableVisibleAssets = useMemo(
    () => sortedAssets.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [sortedAssets, page, rowsPerPage],
  );
  const selectedAssets = useMemo(
    () => sortedAssets.filter((asset) => selectedAssetIds.has(asset.adAssetId)),
    [selectedAssetIds, sortedAssets],
  );
  const selectedAssetCount = selectedAssets.length;
  /** Bulk assign + bulk archive both skip archived rows; single derived count keeps CTA predicates in sync. */
  const nonArchivedSelectedCount = useMemo(
    () => selectedAssets.filter((asset) => !asset.isArchived).length,
    [selectedAssets],
  );
  const selectedCountOnCurrentPage = useMemo(
    () => tableVisibleAssets.filter((asset) => selectedAssetIds.has(asset.adAssetId)).length,
    [selectedAssetIds, tableVisibleAssets],
  );
  const areAllCurrentPageAssetsSelected =
    tableVisibleAssets.length > 0 && selectedCountOnCurrentPage === tableVisibleAssets.length;
  const hasSomeCurrentPageAssetsSelected =
    selectedCountOnCurrentPage > 0 && !areAllCurrentPageAssetsSelected;

  useEffect(() => {
    if (selectedAssetCount === 0) {
      setBulkAssignDialogOpen(false);
      setBulkArchiveDialogOpen(false);
      setBulkAssignUniverseId(undefined);
      setBulkAssignHasError(false);
      setBulkArchiveHasError(false);
      setBulkAssignFailedAssets([]);
      setBulkArchiveFailedAssets([]);
    }
  }, [selectedAssetCount]);

  const clearSelectedAssets = () => {
    setSelectedAssetIds(new Set());
  };

  const handleToggleAssetSelection = (adAssetId: string, checked: boolean) => {
    setSelectedAssetIds((current) => {
      const next = new Set(current);
      if (checked) {
        next.add(adAssetId);
      } else {
        next.delete(adAssetId);
      }
      return next;
    });
  };

  const handleToggleSelectAllCurrentPage = (checked: boolean) => {
    setSelectedAssetIds((current) => {
      const next = new Set(current);
      tableVisibleAssets.forEach((asset) => {
        if (checked) {
          next.add(asset.adAssetId);
        } else {
          next.delete(asset.adAssetId);
        }
      });
      return next;
    });
  };

  const handleOpenBulkAssignDialog = () => {
    setBulkAssignUniverseId(undefined);
    setBulkAssignHasError(false);
    setBulkAssignFailedAssets([]);
    setBulkAssignDialogOpen(true);
  };

  const handleApplyBulkAssign = async () => {
    if (bulkAssignUniverseId === undefined || nonArchivedSelectedCount === 0) {
      return;
    }
    const targets = selectedAssets.filter((asset) => !asset.isArchived);
    const universeId = bulkAssignUniverseId;

    setBulkAssignPending(true);
    setBulkAssignHasError(false);
    setBulkAssignFailedAssets([]);
    try {
      await runBulkFlow(
        {
          invalidateQueries: refetchAdCreatives,
          onAllSucceeded: () => {
            setToast({
              message: translate('Description.SaveCreativeSuccess'),
              severity: 'success',
            });
            clearSelectedAssets();
            setBulkAssignDialogOpen(false);
            setBulkAssignUniverseId(undefined);
          },
          partialSuccessToast: (succeededCount, totalCount) => {
            setToast({
              message: translate('Message.BulkOperationsPartialSuccess', {
                succeededCount: String(succeededCount),
                totalCount: String(totalCount),
              }),
              severity: 'success',
            });
          },
          performAction: (asset) =>
            updateAdCreativeForCurrentWorkspace(asset.adAssetId, { universeId }),
          setFailedAssets: setBulkAssignFailedAssets,
          setHasError: setBulkAssignHasError,
          targets,
          toFailedAsset: (asset) => ({
            adAssetId: asset.adAssetId,
            assetId: String(asset.assetId),
            assetName: asset.assetName,
          }),
        },
        setSelectedAssetIds,
      );
    } finally {
      setBulkAssignPending(false);
    }
  };

  const handleConfirmBulkArchive = async () => {
    const toArchive = selectedAssets.filter((asset) => !asset.isArchived);
    const idsToArchive = toArchive.map((asset) => asset.adAssetId);
    if (selectedAsset && idsToArchive.includes(selectedAsset.adAssetId)) {
      setDetailSheetOpen(false);
      setSelectedAsset(null);
      setPendingUniverseId(undefined);
    }
    setBulkArchivePending(true);
    setBulkArchiveHasError(false);
    setBulkArchiveFailedAssets([]);
    try {
      await runBulkFlow(
        {
          invalidateQueries: refetchAdCreatives,
          onAllSucceeded: () => {
            setToast({
              message: translate('Description.DeleteCreativeSuccess'),
              severity: 'success',
            });
            clearSelectedAssets();
            setBulkArchiveDialogOpen(false);
          },
          partialSuccessToast: (succeededCount, totalCount) => {
            setToast({
              message: translate('Message.BulkOperationsPartialSuccess', {
                succeededCount: String(succeededCount),
                totalCount: String(totalCount),
              }),
              severity: 'success',
            });
          },
          performAction: (asset) => deleteAdCreativeForCurrentWorkspace(asset.adAssetId),
          setFailedAssets: setBulkArchiveFailedAssets,
          setHasError: setBulkArchiveHasError,
          targets: toArchive,
          toFailedAsset: (asset) => ({
            adAssetId: asset.adAssetId,
            assetId: String(asset.assetId),
            assetName: asset.assetName,
          }),
        },
        setSelectedAssetIds,
      );
    } finally {
      setBulkArchivePending(false);
    }
  };

  // Defaults to a generic "Unknown" label rather than silently picking a
  // specific status; if AMA grows a new enum value, the UI surfaces it
  // honestly instead of misrepresenting moderation state.
  const getModerationStatusLabel = (status: ContentModerationStatus) => {
    switch (status) {
      case 'approved':
        return translate('Label.Approved');
      case 'pending_review':
        return translate('Label.InReview');
      case 'rejected':
        return translate('Label.Rejected');
      default:
        return translate('Label.Unknown');
    }
  };

  // Compare wire enums with generated OpenAPI constants.
  const getAssetTypeLabel = (type: string) => {
    switch (type) {
      case AdAssetType.AdAssetTypeImage:
        return translate('Label.Image');
      case AdAssetType.AdAssetTypeVideo:
      case AdAssetType.AdAssetTypeAdsVideo:
        return translate('Label.Video');
      case AdAssetType.AdAssetTypeModel:
        return translate('Label.Model');
      default:
        return translate('Label.Unknown');
    }
  };

  const formatDimensions = (asset: AdAsset) => {
    if (asset.width != null && asset.height != null) {
      return translate('Label.DimensionsValue', {
        height: String(asset.height),
        width: String(asset.width),
      });
    }
    return translate('Label.NotApplicable');
  };

  const renderAssetStatusBadge = (asset: AdAsset) => (
    <AssetStatusBadge
      contentModerationStatus={asset.contentModerationStatus}
      isArchived={asset.isArchived}
      label={
        asset.isArchived
          ? translate('Label.Archived')
          : getModerationStatusLabel(asset.contentModerationStatus)
      }
    />
  );

  const openAssetDetail = (asset: AdAsset) => {
    setSelectedAsset(asset);
    setPendingUniverseId(undefined);
    setPendingAssetName(undefined);
    setDetailSheetOpen(true);
  };

  const handleDetailSheetClose = (open: boolean) => {
    setDetailSheetOpen(open);
    if (!open) {
      setSelectedAsset(null);
      setPendingUniverseId(undefined);
      setPendingAssetName(undefined);
    }
  };

  // Edit action from the per-tile / per-row "..." menu opens the detail
  // sheet where the user can rename the asset and edit game assignment.
  const handleMenuEdit = (asset: AdAsset) => {
    openAssetDetail(asset);
  };

  // Two-step delete: open a confirmation dialog first so a misclick on
  // the small "..." menu can't archive a creative without explicit
  // confirmation.
  const handleMenuDelete = (asset: AdAsset) => {
    setAssetPendingDelete(asset);
  };

  const handleConfirmDelete = () => {
    if (!assetPendingDelete) {
      return;
    }
    const id = assetPendingDelete.adAssetId;
    setAssetPendingDelete(null);
    // Close the detail sheet too if we're deleting the asset it's
    // currently displaying — otherwise the sheet would render a
    // ghost of an archived asset until the user manually closes it.
    if (selectedAsset?.adAssetId === id) {
      setDetailSheetOpen(false);
      setSelectedAsset(null);
      setPendingUniverseId(undefined);
      setPendingAssetName(undefined);
    }
    deleteMutation.mutate(id);
  };

  const handleSaveDetails = () => {
    if (!selectedAsset) {
      return;
    }

    const sanitizedName =
      pendingAssetName !== undefined ? sanitizeAssetDisplayName(pendingAssetName) : undefined;
    const isNameDirty = pendingAssetName !== undefined && sanitizedName !== selectedAsset.assetName;
    const isUniverseDirty =
      pendingUniverseId !== undefined && pendingUniverseId !== selectedAsset.experienceId;

    if (!isNameDirty && !isUniverseDirty) {
      return;
    }
    if (isNameDirty && (sanitizedName == null || selectedAsset.assetId <= 0)) {
      return;
    }

    saveDetailsMutation.mutate(
      {
        assetId: selectedAsset.assetId,
        id: selectedAsset.adAssetId,
        ...(isNameDirty && sanitizedName != null ? { displayName: sanitizedName } : {}),
        ...(isUniverseDirty ? { universeId: pendingUniverseId! } : {}),
      },
      {
        onSuccess: () => {
          setDetailSheetOpen(false);
          setSelectedAsset(null);
          setPendingUniverseId(undefined);
          setPendingAssetName(undefined);
        },
      },
    );
  };

  const renderEmptyState = () => (
    <div className='flex items-center justify-center radius-large stroke-muted stroke-standard padding-xxlarge'>
      <div className='flex flex-col items-center justify-center gap-large max-width-[480px]'>
        <div className='relative flex items-center justify-center width-[122px] height-[122px]'>
          <div
            className={`${tileGridStyles.emptyStateTiltFrame} absolute width-[100px] height-[100px] radius-medium stroke-muted stroke-standard`}
          />
          {/* `@rbx/foundation-ui` Icon `size` presets cap below the empty-state hero; override with utilities. */}
          <Icon className='!size-[72px]' name='icon-regular-square-books' size='XLarge' />
        </div>
        <p className='text-heading-medium content-emphasis text-align-x-center'>
          {translate('Heading.AssetLibraryEmptyState')}
        </p>
        <div className='flex gap-small'>
          <Button onClick={openUploadDrawer} size='Medium' variant='Emphasis'>
            {translate('Action.Upload')}
          </Button>
        </div>
      </div>
    </div>
  );

  /**
   * Per-asset overflow menu used by both the tile and table views. The
   * trigger rendering is up to the caller (a tile uses an OverMedia
   * IconButton, a table row uses a Utility IconButton); this helper
   * just wires up the menu items so the action wiring stays in one
   * place.
   */
  const getAssetOverflowMenuItems = (asset: AdAsset) => [
    {
      onSelect: () => handleMenuEdit(asset),
      title: translate('Action.EditDetails'),
      value: 'edit',
    },
    {
      onSelect: () => copyAssetIdToClipboard(asset.assetId),
      title: translate('Action.CopyAssetId'),
      value: 'copy',
    },
    ...(!asset.isArchived
      ? [
          {
            onSelect: () => handleMenuDelete(asset),
            title: translate('Action.Archive'),
            value: 'archive',
          },
        ]
      : []),
  ];

  // Tile metadata under the asset name. Two layouts by moderation urgency:
  //   • Approved / Archived → "[Asset Type] · [Status]" (muted text only).
  //   • Rejected            → "△! [Status]" (warning triangle + label).
  //   • In review           → "🕐 [Status]" (clock + label).
  // The icon-led layout drops the asset type so the moderation state is
  // the unambiguous focal point on tiles that need user attention.
  const renderTileMetadata = (asset: AdAsset) => {
    const isModerationFlagged =
      !asset.isArchived &&
      (asset.contentModerationStatus === 'rejected' ||
        asset.contentModerationStatus === 'pending_review');

    if (isModerationFlagged) {
      const iconName =
        asset.contentModerationStatus === 'rejected'
          ? 'icon-regular-triangle-exclamation'
          : 'icon-regular-clock';
      return (
        <div className='flex items-center gap-xsmall min-width-0'>
          <Icon name={iconName} size='Small' />
          <span className='text-body-medium content-default text-no-wrap text-truncate-end'>
            {getModerationStatusLabel(asset.contentModerationStatus)}
          </span>
        </div>
      );
    }

    return (
      <p className='text-body-medium content-default text-no-wrap text-truncate-end margin-[0px]'>
        {translate('Label.AssetMetadata', {
          status: asset.isArchived
            ? translate('Label.Archived')
            : getModerationStatusLabel(asset.contentModerationStatus),
          type: getAssetTypeLabel(asset.assetType),
        })}
      </p>
    );
  };

  const renderTile = (asset: AdAsset) => (
    <div
      className={`${tileGridStyles.tile} group min-width-0 cursor-pointer focus-visible:outline-focus`}
      key={asset.adAssetId}
      onClick={() => openAssetDetail(asset)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openAssetDetail(asset);
        }
      }}
      role='button'
      tabIndex={0}>
      <div className='relative'>
        <AssetThumbnail
          alt={asset.assetName}
          aspectRatio='16:9'
          assetId={asset.assetId}
          containerClassName='radius-medium'
          contentModerationStatus={asset.contentModerationStatus}
          fallbackClassName='aspect-16-9 radius-medium clip flex items-center justify-center bg-surface-200'
          fallbackIconSize='Large'
          // Archived takes visual precedence; pending review keeps its
          // upstream thumbnail.
          isRejected={!asset.isArchived && asset.contentModerationStatus === 'rejected'}
          previewImageUrl={asset.thumbnailUrl}
          source={asset.source}
        />
        {/* Omit the floating corner badge: moderation reads from the subtitle row */}
        {/* The trigger is wrapped in a swallow-click container so the
            tile's open-detail-sheet handler doesn't fire when the user
            clicks "..." or selects a menu item. The menu portals out so
            stopPropagation only matters for the trigger itself. */}
        <TileMediaOverflowMenu
          ariaLabel={translate('Label.MoreOptions')}
          iconButtonSize='Small'
          items={getAssetOverflowMenuItems(asset)}
          showOnHover
        />
      </div>
      <div className='min-width-0 width-full padding-top-small'>
        {/* Matches Figma `TileContent`: 8px (padding-small) gap above the title,
            title in title-medium, truncate long titles so metadata baselines
            line up row-to-row. */}
        <p className='text-title-medium content-emphasis text-no-wrap text-truncate-end margin-[0px] padding-bottom-xsmall'>
          {asset.assetName}
        </p>
        {renderTileMetadata(asset)}
      </div>
    </div>
  );

  const renderTileGrid = () => (
    <>
      <div className={tileGridStyles.tileGrid}>{tileVisibleAssets.map(renderTile)}</div>
      {/* Same paginator the list view uses, wired to the tile view's own
          page / page-size state and defaulting to TILE_PAGE_SIZE (200). */}
      <FoundationTablePagination
        onPageChange={setTilePage}
        onRowsPerPageChange={setTileRowsPerPage}
        page={tilePage}
        rowsPerPage={tileRowsPerPage}
        totalRows={sortedAssets.length}
      />
    </>
  );

  const renderTableRow = (asset: AdAsset) => {
    const handleOpenAssetDetailKeyDown = (event: KeyboardEvent<HTMLElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openAssetDetail(asset);
      }
    };

    return (
      <TableRow
        className={tileGridStyles.listRow}
        isHoverable
        isSelected={selectedAssetIds.has(asset.adAssetId)}
        key={asset.adAssetId}>
        <TableCell className={tileGridStyles.cellTight}>
          <Checkbox
            aria-label={translate('Label.SelectCreative')}
            isChecked={selectedAssetIds.has(asset.adAssetId)}
            onCheckedChange={(checked) =>
              handleToggleAssetSelection(asset.adAssetId, checked === true)
            }
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.stopPropagation();
              }
            }}
            placement='Start'
            size='XSmall'
          />
        </TableCell>
        <TableCell>
          {/* Row-leading thumbnail + title stack; gap follows Foundation spacing, thumb uses list density. */}
          <div className='flex min-width-0 items-start gap-small'>
            <div
              className={`${tileGridStyles.listAssetThumbnail} cursor-pointer`}
              onClick={() => openAssetDetail(asset)}
              onKeyDown={handleOpenAssetDetailKeyDown}
              role='button'
              tabIndex={0}>
              <AssetThumbnail
                alt={asset.assetName}
                aspectRatio='16:9'
                assetId={asset.assetId}
                containerClassName='radius-small height-full width-full'
                contentModerationStatus={asset.contentModerationStatus}
                fallbackClassName='radius-small clip flex height-full width-full items-center justify-center bg-surface-200'
                fallbackIconSize='Large'
                isRejected={!asset.isArchived && asset.contentModerationStatus === 'rejected'}
                previewImageUrl={asset.thumbnailUrl}
                source={asset.source}
              />
            </div>
            <div className='flex min-width-0 flex-1 flex-col'>
              <span
                className={`${tileGridStyles.listTableBodyText} content-emphasis margin-[0px] max-width-full cursor-pointer text-no-wrap text-truncate-end`}
                onClick={() => openAssetDetail(asset)}
                onKeyDown={handleOpenAssetDetailKeyDown}
                role='button'
                tabIndex={0}>
                {asset.assetName}
              </span>
              <div className='flex min-width-0 items-center gap-xsmall'>
                <p className='margin-[0px] min-width-0 flex-1 text-body-small content-default text-no-wrap text-truncate-end'>
                  {String(asset.assetId)}
                </p>
                <span className={`${tileGridStyles.copyIconWrapper} shrink-0`}>
                  <IconButton
                    ariaLabel={translate('Action.CopyAssetId')}
                    icon='icon-regular-two-stacked-squares'
                    onClick={(e) => {
                      e.stopPropagation();
                      copyAssetIdToClipboard(asset.assetId);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.stopPropagation();
                      }
                    }}
                    size='Small'
                    variant='Utility'
                  />
                </span>
              </div>
            </div>
          </div>
        </TableCell>
        <TableCell>
          {/* Status column: tinted dot plus label */}
          <span className='flex min-width-0 items-center gap-small'>
            <span
              aria-hidden='true'
              className={`shrink-0 size-[8px] radius-circle ${getStatusDotColorClass(asset)}`}
            />
            <span className='text-body-small content-emphasis margin-[0px] min-width-0 text-no-wrap text-truncate-end'>
              {asset.isArchived
                ? translate('Label.Archived')
                : getModerationStatusLabel(asset.contentModerationStatus)}
            </span>
          </span>
        </TableCell>
        <TableCell className={tileGridStyles.listTableDataCell}>
          <p className='margin-[0px] content-emphasis text-no-wrap text-truncate-end'>
            {getGameLabel(asset.experienceId)}
          </p>
        </TableCell>
        <TableCell className={tileGridStyles.listTableDataCell}>
          <p className='margin-[0px] content-emphasis text-no-wrap text-truncate-end'>
            {getAssetTypeLabel(asset.assetType)}
          </p>
        </TableCell>
        <TableCell className={tileGridStyles.listTableDataCell}>
          <p className='margin-[0px] content-emphasis text-no-wrap text-truncate-end'>
            {asset.createdAt ? dateAddedFormatter.format(new Date(asset.createdAt)) : ''}
          </p>
        </TableCell>
        <TableCell align='end' className={tileGridStyles.cellAction}>
          {/* Overflow menu is row-local; stopPropagation guards against any future row handlers. */}
          <div
            className='flex justify-end'
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.stopPropagation();
              }
            }}
            role='presentation'>
            <TileMediaOverflowMenu
              ariaLabel={translate('Label.MoreOptions')}
              items={getAssetOverflowMenuItems(asset)}
              trigger={
                <IconButton
                  ariaLabel={translate('Label.MoreOptions')}
                  icon='icon-regular-three-dots-vertical'
                  isCircular
                  size='Small'
                  variant='Utility'
                />
              }
            />
          </div>
        </TableCell>
      </TableRow>
    );
  };

  const renderTable = () => (
    <div className='overflow-x-auto'>
      <Table className={tileGridStyles.listTable}>
        <colgroup>
          <col className={tileGridStyles.colCheckbox} />
          <col className={tileGridStyles.colAssetName} />
          <col className={tileGridStyles.colStatus} />
          <col className={tileGridStyles.colGame} />
          <col className={tileGridStyles.colMediaType} />
          <col className={tileGridStyles.colDateAdded} />
          <col className={tileGridStyles.colActions} />
        </colgroup>
        <TableHeader>
          <TableRow>
            <TableHeaderCell align='center' className={tileGridStyles.cellTight}>
              <Checkbox
                aria-label={translate('Label.SelectAllCreatives')}
                isChecked={
                  hasSomeCurrentPageAssetsSelected
                    ? 'indeterminate'
                    : areAllCurrentPageAssetsSelected
                }
                onCheckedChange={(checked) => handleToggleSelectAllCurrentPage(checked === true)}
                placement='Start'
                size='XSmall'
              />
            </TableHeaderCell>
            <TableHeaderCell>
              <span className='text-label-medium content-emphasis text-no-wrap text-truncate-end'>
                {translate('Label.AssetName')}
              </span>
            </TableHeaderCell>
            <TableHeaderCell>
              <span className='text-label-medium content-emphasis text-no-wrap text-truncate-end'>
                {translate('Label.Status')}
              </span>
            </TableHeaderCell>
            <TableHeaderCell>
              <span className='text-label-medium content-emphasis text-no-wrap text-truncate-end'>
                {translate('Label.Game')}
              </span>
            </TableHeaderCell>
            <TableHeaderCell>
              <span className='text-label-medium content-emphasis text-no-wrap text-truncate-end'>
                {translate('Label.MediaType')}
              </span>
            </TableHeaderCell>
            <TableHeaderCell>
              <span className='text-label-medium content-emphasis text-no-wrap text-truncate-end'>
                {translate('Label.DateAdded')}
              </span>
            </TableHeaderCell>
            <TableHeaderCell align='end' className={tileGridStyles.cellAction}>
              <div className='flex justify-end'>
                <span aria-hidden='true' className='inline-block shrink-0 width-[28px]' />
              </div>
            </TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>{tableVisibleAssets.map(renderTableRow)}</TableBody>
      </Table>
    </div>
  );

  const renderBulkActionsRow = () => {
    if (viewMode !== VIEW_MODE.LIST || selectedAssetCount === 0) {
      return null;
    }
    const disableBulkActions =
      saveDetailsMutation.isPending ||
      deleteMutation.isPending ||
      bulkAssignPending ||
      bulkArchivePending;
    return (
      <div className='flex items-center gap-medium padding-bottom-medium'>
        <span className='text-label-medium content-emphasis'>{translate('Label.BulkActions')}</span>
        <Button
          isDisabled={disableBulkActions || nonArchivedSelectedCount === 0}
          onClick={handleOpenBulkAssignDialog}
          size='Small'
          variant='Standard'>
          {translate('Action.AssignGame')}
        </Button>
        <Button
          isDisabled={disableBulkActions || nonArchivedSelectedCount === 0}
          onClick={() => {
            setBulkArchiveFailedAssets([]);
            setBulkArchiveHasError(false);
            setBulkArchiveDialogOpen(true);
          }}
          size='Small'
          variant='Standard'>
          {translate('Action.Archive')}
        </Button>
        <Button
          isDisabled={disableBulkActions}
          onClick={clearSelectedAssets}
          size='Small'
          variant='Utility'>
          {translateForecast('Action.Clear')}
        </Button>
      </div>
    );
  };

  const renderNoResults = () => (
    <p className='text-body-medium content-muted text-align-x-center padding-y-xxlarge'>
      {translate('Description.NoCreativesMatch')}
    </p>
  );

  const renderListView = () => (
    <>
      {renderBulkActionsRow()}
      {renderTable()}
      <FoundationTablePagination
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
        page={page}
        rowsPerPage={rowsPerPage}
        totalRows={sortedAssets.length}
      />
    </>
  );

  // Top-level results renderer. Three states: no matches for the active
  // filters, the paginated table view, or the paginated tile view (both
  // capped per page; tiles lazy-load their images via native loading="lazy").
  // Pulled out into a single function so the JSX below avoids the nested
  // ternary `no-nested-ternary` lint.
  const renderResults = () => {
    if (sortedAssets.length === 0) {
      return renderNoResults();
    }
    if (viewMode === VIEW_MODE.LIST) {
      return renderListView();
    }
    return renderTileGrid();
  };

  const renderDetailRow = (label: string, value: ReactNode) => (
    <div className='flex items-center justify-between padding-y-medium' key={label}>
      <span className='text-body-medium content-emphasis'>{label}</span>
      {typeof value === 'string' ? (
        <span className='text-title-medium content-emphasis text-right'>{value}</span>
      ) : (
        <div className='flex justify-end'>{value}</div>
      )}
    </div>
  );

  // Hairline-separated detail list — dividers only between rows so the block
  // ends cleanly above the Archive region without a dangling rule after the final row.
  const renderDetailRows = (rows: ReadonlyArray<{ label: string; value: ReactNode }>) =>
    rows.map((row, index) => (
      <Fragment key={row.label}>
        {index > 0 && <Divider />}
        {renderDetailRow(row.label, row.value)}
      </Fragment>
    ));

  // Asset-detail sheet layout: hero preview, optional game assignment, definition-list metadata,
  // and archive action — Creative Library design-system pattern.
  const renderDetailSheet = () => {
    // Pending edit takes precedence over saved value.
    const effectiveUniverseId =
      pendingUniverseId === undefined ? (selectedAsset?.experienceId ?? null) : pendingUniverseId;
    const effectiveAssetName = pendingAssetName ?? selectedAsset?.assetName ?? '';
    const sanitizedPendingName =
      pendingAssetName !== undefined ? sanitizeAssetDisplayName(pendingAssetName) : undefined;
    const isNameDirty =
      pendingAssetName !== undefined && sanitizedPendingName !== selectedAsset?.assetName;
    const isUniverseDirty =
      pendingUniverseId !== undefined && pendingUniverseId !== selectedAsset?.experienceId;
    const isDirty = isNameDirty || isUniverseDirty;
    const isNameInvalid = isNameDirty && sanitizedPendingName == null;
    let gameDropdownValue: string | undefined;
    if (pendingUniverseId === null) {
      gameDropdownValue = 'none';
    } else if (effectiveUniverseId != null) {
      gameDropdownValue = String(effectiveUniverseId);
    }
    const detailSheetUniverses = getUniversesWithSelectedUniverse(
      advertisableUniverses,
      effectiveUniverseId,
      getGameLabel(effectiveUniverseId),
    );
    const isSaving = saveDetailsMutation.isPending;
    const isDeleting = deleteMutation.isPending;
    // Archived assets are read-only at the experience-edit level: the
    // dropdown is locked and Save is force-disabled so the user can't
    // mutate metadata on a row that isn't usable in campaigns.
    const isArchived = !!selectedAsset?.isArchived;

    return (
      <SheetRoot onOpenChange={handleDetailSheetClose} open={detailSheetOpen}>
        <SheetContent
          closeLabel={translateMisc('Action.Close')}
          largeScreenClassName='!max-width-[600px] width-full'
          largeScreenVariant='side'>
          <SheetTitle>{translate('Heading.AssetDetails')}</SheetTitle>
          <SheetBody>
            {selectedAsset && (
              <div className='flex flex-col gap-large min-width-0'>
                <div className='radius-large clip'>
                  <AssetThumbnail
                    alt={selectedAsset.assetName}
                    aspectRatio='16:9'
                    assetId={selectedAsset.assetId}
                    contentModerationStatus={selectedAsset.contentModerationStatus}
                    fallbackClassName='aspect-16-9 flex items-center justify-center bg-surface-200 padding-xxlarge'
                    fallbackIconSize='XLarge'
                    // Letterbox in the detail-sheet preview so vertical
                    // sources show in full instead of getting cropped to
                    // the 16:9 hero. Tiles + table rows keep the default
                    // cover behaviour so the grid stays uniform.
                    fit='contain'
                    isRejected={
                      !selectedAsset.isArchived &&
                      selectedAsset.contentModerationStatus === 'rejected'
                    }
                    previewImageUrl={selectedAsset.thumbnailUrl}
                    source={selectedAsset.source}
                  />
                </div>

                <div className='min-width-0'>
                  {isArchived || selectedAsset.assetId <= 0 ? (
                    <p
                      className={`text-heading-medium content-emphasis text-wrap ${tileGridStyles.assetNameWrapAnywhere}`}>
                      {selectedAsset.assetName}
                    </p>
                  ) : (
                    <TextInput
                      error={isNameInvalid ? translateReport('Validation.Required') : undefined}
                      hasError={isNameInvalid}
                      helperText={
                        isNameInvalid
                          ? undefined
                          : translate('Description.AddCustomNameToCreativeAssets')
                      }
                      label={translate('Label.Name')}
                      maxLength={MAX_ASSET_DISPLAY_NAME_LENGTH}
                      onChange={(event) => setPendingAssetName(event.target.value)}
                      size='Medium'
                      value={effectiveAssetName}
                    />
                  )}
                </div>

                {detailSheetUniverses.length > 0 && (
                  <GameUniverseDropdown
                    advertisableUniverses={detailSheetUniverses}
                    hint={translate('Description.AssetsAssignedToGame')}
                    isDisabled={isArchived || isSaving || isDeleting}
                    label={translate('Label.GameOptional')}
                    onValueChange={(value) =>
                      setPendingUniverseId(value === 'none' ? null : Number(value))
                    }
                    placeholder={translate('Label.SelectAGame')}
                    staticOptions={[{ label: translate('Label.None'), value: 'none' }]}
                    value={gameDropdownValue}
                  />
                )}

                <div className='flex flex-col'>
                  <p className='text-title-medium content-emphasis padding-bottom-small'>
                    {translate('Heading.Details')}
                  </p>
                  <Divider />
                  {renderDetailRows([
                    {
                      label: translate('Label.AssetType'),
                      value: getAssetTypeLabel(selectedAsset.assetType),
                    },
                    {
                      label: translate('Label.Dimensions'),
                      value: formatDimensions(selectedAsset),
                    },
                    {
                      label: translate('Label.DateAdded'),
                      value: selectedAsset.createdAt
                        ? dateAddedFormatter.format(new Date(selectedAsset.createdAt))
                        : translate('Label.NotApplicable'),
                    },
                    {
                      label: translate('Label.Status'),
                      value: renderAssetStatusBadge(selectedAsset),
                    },
                  ])}
                </div>

                {!selectedAsset.isArchived && (
                  <div className='padding-bottom-large'>
                    <Button
                      isDisabled={!selectedAsset || isSaving || isDeleting}
                      onClick={() => selectedAsset && handleMenuDelete(selectedAsset)}
                      size='Medium'
                      variant='Alert'>
                      {translate('Action.Archive')}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </SheetBody>
          <SheetActions className='flex flex-row wrap items-center gap-medium'>
            <Button
              // Save applies pending name and/or game assignment edits.
              isDisabled={isArchived || !isDirty || isNameInvalid || isSaving || isDeleting}
              isLoading={isSaving}
              onClick={handleSaveDetails}
              size='Medium'
              variant='Emphasis'>
              {translateMisc('Action.Save')}
            </Button>
            <Button
              isDisabled={isSaving || isDeleting}
              onClick={() => handleDetailSheetClose(false)}
              size='Medium'
              variant='Standard'>
              {translateMisc('Action.Close')}
            </Button>
          </SheetActions>
        </SheetContent>
      </SheetRoot>
    );
  };

  // Archive confirmation dialog.
  const renderDeleteDialog = () => (
    <Dialog
      // Footer actions are the only dismiss paths.
      hasCloseAffordance={false}
      hasDescription
      // Disable DialogBody's default vertical margins (`hasMargin*`) so we rely on explicit
      // title/description/footer padding alone and avoid stacking double vertical gaps.
      hasMarginBottom={false}
      hasMarginTop={false}
      isModal
      onOpenChange={(open) => {
        if (!open) {
          setAssetPendingDelete(null);
        }
      }}
      open={assetPendingDelete != null}
      size='Small'>
      <DialogContent
        aria-describedby='archive-dialog-description'
        className='!max-width-[480px] !min-width-[376px]'>
        {/* BRITTLE: remove if Foundation adds DialogTitle defaults.
            Radix renders DialogTitle as <h2>, which has a default browser
            margin (~1em top/bottom) that stacks on top of the explicit
            padding tokens; margin-[0px] keeps the spacing predictable. */}
        <DialogTitle className='padding-x-large padding-top-large padding-bottom-xsmall margin-[0px] text-heading-small content-emphasis'>
          {translate('Heading.ArchiveAsset')}
        </DialogTitle>
        <DialogBody className='padding-y-xxsmall'>
          {/* Browser default <p> margin (~1em top/bottom) was bleeding past
              the Foundation 0/none reset and inflating the visible gap to
              the title and footer; explicit margin-[0px] keeps the spacing
              equal to the surrounding padding tokens. */}
          <p
            className='text-body-medium content-default margin-[0px]'
            id='archive-dialog-description'>
            {translate('Description.ArchiveAssetConfirm')}
          </p>
        </DialogBody>
        <DialogFooter className='padding-top-large'>
          {/* Leading confirm + trailing dismiss, right-aligned */}
          <div className='flex gap-small justify-end width-full'>
            <Button
              className='min-width-1600'
              onClick={handleConfirmDelete}
              size='Medium'
              variant='Alert'>
              {translate('Action.OK')}
            </Button>
            <Button
              className='min-width-1600'
              onClick={() => setAssetPendingDelete(null)}
              size='Medium'
              variant='Standard'>
              {translateMisc('Action.Cancel')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderBulkDialogErrorBanner = (
    summary: ReactNode,
    failedAssets: BulkFlowFailedAsset[],
    onDismissError: () => void,
  ) => (
    <div
      className={`${tileGridStyles.bulkErrorAlert} flex flex-col gap-small radius-medium padding-x-medium padding-y-small`}>
      <div className='flex items-start justify-between gap-small'>
        <div className='flex min-width-0 flex-1 flex-col gap-xxsmall'>{summary}</div>
        <IconButton
          ariaLabel={translateMisc('Action.Close')}
          icon='icon-filled-x'
          onClick={onDismissError}
          size='XSmall'
          variant='Utility'
        />
      </div>
      {failedAssets.length > 0 ? (
        <ul className='margin-[0px] padding-left-large'>
          {failedAssets.map((a) => (
            <li className='padding-y-xxsmall' key={a.adAssetId}>
              <span className='margin-[0px] text-body-small content-emphasis'>{a.assetName}</span>
              <span className='margin-[0px] text-body-small content-default'>
                {' · '}
                {translate('Label.AssetIdInline', { assetId: a.assetId })}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );

  const renderBulkAssignDialog = () => {
    let bulkAssignDropdownValue: string | undefined;
    if (bulkAssignUniverseId === null) {
      bulkAssignDropdownValue = 'none';
    } else if (bulkAssignUniverseId !== undefined) {
      bulkAssignDropdownValue = String(bulkAssignUniverseId);
    }
    const isAssignDisabled =
      bulkAssignUniverseId === undefined || nonArchivedSelectedCount === 0 || bulkAssignPending;
    return (
      <Dialog
        hasCloseAffordance={false}
        hasDescription
        hasMarginBottom={false}
        hasMarginTop={false}
        isModal
        onOpenChange={(open) => {
          setBulkAssignDialogOpen(open);
          if (!open) {
            setBulkAssignUniverseId(undefined);
            setBulkAssignHasError(false);
            setBulkAssignFailedAssets([]);
          }
        }}
        open={bulkAssignDialogOpen}
        size='Small'>
        <DialogContent
          // Form-only dialog: title + labeled control carry the copy; opt out
          // of Radix's implicit description slot so Foundation doesn't warn.
          aria-describedby={undefined}
          className='!max-width-[480px] !min-width-[376px]'>
          <DialogTitle className='padding-x-large padding-top-large padding-bottom-xsmall margin-[0px] text-heading-small content-emphasis'>
            {translate('Heading.BulkAssignGame')}
          </DialogTitle>
          <DialogBody className='padding-y-xxsmall'>
            <div className='flex flex-col gap-medium'>
              {bulkAssignHasError &&
                renderBulkDialogErrorBanner(
                  <p className='margin-[0px] text-body-small content-emphasis'>
                    {translateMisc('Label.Error')}{' '}
                    {translate('Message.UnableAssignAssetsToSelectedGame')}
                  </p>,
                  bulkAssignFailedAssets,
                  () => {
                    setBulkAssignHasError(false);
                    setBulkAssignFailedAssets([]);
                  },
                )}
              <GameUniverseDropdown
                advertisableUniverses={advertisableUniverses}
                hint={translate('Description.AssetsAssignedToGame')}
                isDisabled={bulkAssignPending}
                label={translate('Label.Game')}
                onValueChange={(value) => {
                  setBulkAssignUniverseId(value === 'none' ? null : Number(value));
                  setBulkAssignHasError(false);
                  setBulkAssignFailedAssets([]);
                }}
                placeholder={translate('Label.SelectAGame')}
                staticOptions={[{ label: translate('Label.None'), value: 'none' }]}
                value={bulkAssignDropdownValue}
              />
            </div>
          </DialogBody>
          <DialogFooter className='padding-top-large'>
            <div className='flex items-center justify-end gap-small width-full'>
              <Button
                isDisabled={isAssignDisabled}
                isLoading={bulkAssignPending}
                onClick={handleApplyBulkAssign}
                size='Medium'
                variant='Emphasis'>
                {translate('Action.AssignWithCount', { count: String(nonArchivedSelectedCount) })}
              </Button>
              <Button
                isDisabled={bulkAssignPending}
                onClick={() => {
                  setBulkAssignDialogOpen(false);
                  setBulkAssignUniverseId(undefined);
                  setBulkAssignHasError(false);
                  setBulkAssignFailedAssets([]);
                }}
                size='Medium'
                variant='Standard'>
                {translateMisc('Action.Cancel')}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  const renderBulkArchiveDialog = () => (
    <Dialog
      hasCloseAffordance={false}
      hasDescription
      hasMarginBottom={false}
      hasMarginTop={false}
      isModal
      onOpenChange={(open) => {
        setBulkArchiveDialogOpen(open);
        if (!open) {
          setBulkArchiveHasError(false);
          setBulkArchiveFailedAssets([]);
        }
      }}
      open={bulkArchiveDialogOpen}
      size='Small'>
      <DialogContent
        aria-describedby='bulk-archive-description'
        className='!max-width-[480px] !min-width-[376px]'>
        <DialogTitle className='padding-x-large padding-top-large padding-bottom-xsmall margin-[0px] text-heading-small content-emphasis'>
          {translate('Heading.BulkArchive')}
        </DialogTitle>
        <DialogBody className='padding-y-xxsmall'>
          <div className='flex flex-col gap-medium'>
            <p
              className='text-body-medium content-default margin-[0px]'
              id='bulk-archive-description'>
              {translate('Description.BulkArchiveConfirm')}
            </p>
            {bulkArchiveHasError &&
              renderBulkDialogErrorBanner(
                <p className='margin-[0px] text-body-small content-emphasis'>
                  {translate('Label.UnableToArchive')}{' '}
                  {translate('Message.UnableToArchiveAssetsInUse')}
                </p>,
                bulkArchiveFailedAssets,
                () => {
                  setBulkArchiveHasError(false);
                  setBulkArchiveFailedAssets([]);
                },
              )}
          </div>
        </DialogBody>
        <DialogFooter className='padding-top-large'>
          <div className='flex items-center justify-end gap-small width-full'>
            <Button
              isDisabled={bulkArchivePending || nonArchivedSelectedCount === 0}
              isLoading={bulkArchivePending}
              onClick={handleConfirmBulkArchive}
              size='Medium'
              variant='Alert'>
              {translate('Action.ArchiveWithCount', { count: String(nonArchivedSelectedCount) })}
            </Button>
            <Button
              isDisabled={bulkArchivePending}
              onClick={() => setBulkArchiveDialogOpen(false)}
              size='Medium'
              variant='Standard'>
              {translateMisc('Action.Cancel')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  if (shouldWaitForWorkspace) {
    return <CenteredCircularProgress />;
  }

  return (
    <div className='flex flex-col gap-large'>
      <div className='flex flex-wrap items-center justify-between gap-medium padding-top-xsmall'>
        <h1 className='margin-[0px] text-heading-large content-emphasis'>
          {translate('Heading.CreativeLibrary')}
        </h1>
        <div className='flex items-center gap-small'>
          <Button
            className='!padding-x-large'
            onClick={openUploadDrawer}
            size='Medium'
            variant='Emphasis'>
            {translate('Action.AddAsset')}
          </Button>
          {isGenAiCreativesEnabled ? (
            <DismissibleTooltip
              anchorElement={
                <Button
                  icon={AI_CREATE_GENERATE_ICON}
                  onClick={openAiCreateDrawer}
                  size='Medium'
                  variant='Standard'>
                  {translate('Action.Generate')}
                </Button>
              }
              // Opening the AI drawer means the user has engaged with Generate,
              // so retire the coachmark instead of waiting for the OK button.
              dismissOnAnchorClick
              tooltip={Tooltips.GEN_AI_CREATE}
            />
          ) : null}
        </div>
      </div>

      <div className='flex items-center justify-between gap-medium'>
        <div className='flex items-center gap-large flex-1'>
          <div className='shrink-0 width-[228px]'>
            <TextInput
              aria-label={translate('Label.Search')}
              leadingIconName='icon-regular-magnifying-glass'
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={translate('Label.FindByNameOrId')}
              size='Medium'
              value={searchTerm}
            />
          </div>

          <Button
            icon='icon-regular-three-bars-horizontal-narrowing'
            onClick={() => setFilterDrawerOpen(true)}
            size='Medium'
            variant='Standard'>
            {activeFilterCount > 0
              ? translate('Action.FilterByWithCount', { count: String(activeFilterCount) })
              : translate('Action.FilterBy')}
          </Button>
          {activeFilterCount > 0 && (
            <Button onClick={handleClearAllFilters} size='Medium' variant='Utility'>
              {translate('Action.ResetFilters')}
            </Button>
          )}
        </div>

        <div className='shrink-0'>
          <SegmentedControl
            aria-label={translate('Label.ViewMode')}
            items={[
              {
                'aria-label': translate('Label.ListView'),
                icon: 'icon-regular-list-bulleted',
                value: VIEW_MODE.LIST,
              },
              {
                'aria-label': translate('Label.TileView'),
                icon: 'icon-regular-grid',
                value: VIEW_MODE.TILE,
              },
            ]}
            onValueChange={(value) => setViewMode(value as ViewMode)}
            size='Medium'
            value={viewMode}
            variant='Icon'
          />
        </div>
      </div>

      <div className='padding-bottom-large'>
        {isLoading ? <CenteredCircularProgress /> : null}
        {!isLoading && assets.length === 0 ? renderEmptyState() : null}
        {!isLoading && assets.length > 0 ? renderResults() : null}
      </div>

      {renderDetailSheet()}
      {renderDeleteDialog()}
      {renderBulkAssignDialog()}
      {renderBulkArchiveDialog()}

      <UploadCreativesDrawer onOpenChange={setUploadDrawerOpen} open={uploadDrawerOpen} />
      {isGenAiCreativesEnabled ? (
        <AiCreateDrawer
          onOpenChange={setAiCreateDrawerOpen}
          open={aiCreateDrawerOpen}
          showGameSelector
        />
      ) : null}

      <CreativeLibraryFilterDrawer
        advertisableUniverses={advertisableUniverses}
        experience={filterExperience}
        mediaTypes={filterMediaTypes}
        onApply={handleApplyFilters}
        onOpenChange={setFilterDrawerOpen}
        open={filterDrawerOpen}
        sources={filterSources}
        statuses={filterStatuses}
      />

      {toast && (
        <GenericSnackBar
          message={toast.message}
          onClose={() => setToast(null)}
          severity={toast.severity}
        />
      )}
    </div>
  );
};

export default CreativeLibrary;
