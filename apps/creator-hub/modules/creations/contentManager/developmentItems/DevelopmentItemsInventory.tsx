import type { FunctionComponent } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { Alert, clsx, ProgressCircle, SegmentedControl } from '@rbx/foundation-ui';
import type { TSegmentedControlIconItem } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { useLocalStorage } from '@rbx/react-utilities';
import {
  CreatorInventoryAssetType,
  CreatorInventorySourceType,
} from '@modules/clients/creatorInventory';
import { useQueryParams } from '@modules/miscellaneous/hooks';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { creatorHub } from '@modules/miscellaneous/urls';
import useCreationsFilters from '../../common/hooks/useCreationsFilters';
import { addPublishingConsolidationReturnTo } from '../../common/utils/publishingConsolidationNavigation';
import DevelopmentItemsActiveFiltersRow from './components/DevelopmentItemsActiveFiltersRow';
import type { DevelopmentItemsActiveFilterChip } from './components/DevelopmentItemsActiveFiltersRow';
import DevelopmentItemsEmptyState from './components/DevelopmentItemsEmptyState';
import DevelopmentItemsFilterSheet from './components/DevelopmentItemsFilterSheet';
import type { DevelopmentItemsSheetFilters } from './components/DevelopmentItemsFilterSheet';
import DevelopmentItemsGrid from './components/DevelopmentItemsGrid';
import DevelopmentItemsLegacyEntryPoints from './components/DevelopmentItemsLegacyEntryPoints';
import DevelopmentItemsList from './components/DevelopmentItemsList';
import DevelopmentItemsPagination from './components/DevelopmentItemsPagination';
import type { DevelopmentItemsPaginationProps } from './components/DevelopmentItemsPagination';
import DevelopmentItemsScopedSearch from './components/DevelopmentItemsScopedSearch';
import type { DevelopmentItemsSearchScope } from './components/DevelopmentItemsScopedSearch';
import DevelopmentItemsToolbar from './components/DevelopmentItemsToolbar';
import InventoryFilterDropdown from './components/InventoryFilterDropdown';
import {
  buildCreatorInventoryScope,
  DevelopmentItemsSourceFilter,
  developmentItemsAssetTypes,
  filterDevelopmentItemsByArchivedState,
  hasActiveDevelopmentItemsInventoryFilters,
  isDevelopmentItemDirectlyArchivable,
  isDevelopmentItemsAssetTypeSelection,
  isDevelopmentItemsSourceSelection,
  isDevelopmentItemsView,
  mergeOptimisticArchivedDevelopmentItems,
  type DevelopmentItemsAssetTypeSelection,
  type DevelopmentItemsInventoryItem,
  type DevelopmentItemsSourceSelection,
  type DevelopmentItemsView,
} from './developmentItemsInventoryUtils';
import useDevelopmentItemArchivableAssetIds from './useDevelopmentItemArchivableAssetIds';
import useDevelopmentItemsInventory, {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
} from './useDevelopmentItemsInventory';
import useDevelopmentItemsInventoryTranslations from './useDevelopmentItemsInventoryTranslations';
import useDevelopmentItemThumbnailUrls from './useDevelopmentItemThumbnailUrls';
import useLegacyArchivedDevelopmentItemsInventory, {
  LEGACY_ARCHIVED_DEFAULT_PAGE_SIZE,
  LEGACY_ARCHIVED_PAGE_SIZE_OPTIONS,
} from './useLegacyArchivedDevelopmentItemsInventory';

const INVENTORY_QUERY_KEYS = [
  'activeTab',
  'inventoryPage',
  'inventoryPageSize',
  'inventoryPageToken',
  'inventoryQuery',
  'inventorySource',
  'inventoryView',
] as const;

const DEFAULT_INVENTORY_VIEW: DevelopmentItemsView = 'list';
const INVENTORY_VIEW_STORAGE_KEY = 'developmentItemsInventoryView';

const assetTypeLabelKeys: Record<CreatorInventoryAssetType, string> = {
  [CreatorInventoryAssetType.Animation]: 'Label.Animations',
  [CreatorInventoryAssetType.Audio]: 'Label.Audios',
  [CreatorInventoryAssetType.Decal]: 'Label.Decals',
  [CreatorInventoryAssetType.Image]: 'Label.Images',
  [CreatorInventoryAssetType.Mesh]: 'Label.Meshes',
  [CreatorInventoryAssetType.MeshPart]: 'Label.MeshParts',
  [CreatorInventoryAssetType.Model]: 'Label.ModelsAndPackages',
  [CreatorInventoryAssetType.Plugin]: 'Label.Plugins',
  [CreatorInventoryAssetType.Video]: 'Label.Videos',
};

const FILTER_DROPDOWN_CLASS = '[width:192px]';
const EMPTY_ARCHIVABLE_ASSET_IDS: ReadonlySet<number> = new Set();
const EMPTY_THUMBNAIL_URLS: ReadonlyMap<number, string> = new Map();
const PAGE_SIZE_OPTION_SET = new Set<number>(PAGE_SIZE_OPTIONS);
const LEGACY_ARCHIVED_PAGE_SIZE_OPTION_SET = new Set<number>(LEGACY_ARCHIVED_PAGE_SIZE_OPTIONS);

const DEFAULT_SHEET_FILTERS: DevelopmentItemsSheetFilters = {
  showArchived: false,
  source: CreatorInventorySourceType.Created,
};

const getQueryValue = (value: string | string[] | undefined | null) => {
  const result = Array.isArray(value) ? value[0] : value;
  return result ?? undefined;
};

const getPage = (value: string | undefined) => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isNaN(parsed) || parsed < 0 ? 0 : parsed;
};

const getPageSize = (value: string | undefined) => {
  const parsed = Number.parseInt(value ?? '', 10);
  return PAGE_SIZE_OPTION_SET.has(parsed) ? parsed : DEFAULT_PAGE_SIZE;
};

export type DevelopmentItemsInventoryProps = {
  groupId?: number;
  useTabNavigationSpacing?: boolean;
  userId?: number;
};

const DevelopmentItemsInventory: FunctionComponent<DevelopmentItemsInventoryProps> = ({
  groupId,
  useTabNavigationSpacing = false,
  userId,
}) => {
  const router = useRouter();
  const { translate } = useTranslation();
  const { isArchived, setIsArchived } = useCreationsFilters();
  const translations = useDevelopmentItemsInventoryTranslations();
  const { inventorySourceFilter, searchSuggestion } = translations;
  const [queryParams, setQueryParams] = useQueryParams(INVENTORY_QUERY_KEYS);
  const sourceLabels = useMemo<Record<DevelopmentItemsSourceSelection, string>>(
    () => ({
      [DevelopmentItemsSourceFilter.All]: translations.allSources,
      [CreatorInventorySourceType.Created]: translations.uploadedByMe,
      [CreatorInventorySourceType.Purchased]: translations.acquiredFromStore,
      [CreatorInventorySourceType.Shared]: translations.sharedWithMe,
    }),
    [
      translations.acquiredFromStore,
      translations.allSources,
      translations.sharedWithMe,
      translations.uploadedByMe,
    ],
  );
  const viewItems = useMemo<TSegmentedControlIconItem[]>(
    () => [
      {
        value: 'grid',
        icon: 'icon-regular-grid',
        'aria-label': translations.grid,
      },
      {
        value: 'list',
        icon: 'icon-regular-list-bulleted',
        'aria-label': translations.list,
      },
    ],
    [translations.grid, translations.list],
  );

  const queryAssetType = getQueryValue(queryParams.activeTab);
  const assetType: DevelopmentItemsAssetTypeSelection = isDevelopmentItemsAssetTypeSelection(
    queryAssetType,
  )
    ? queryAssetType
    : CreatorInventoryAssetType.Model;

  const querySource = getQueryValue(queryParams.inventorySource);
  const source: DevelopmentItemsSourceSelection = isDevelopmentItemsSourceSelection(querySource)
    ? querySource
    : CreatorInventorySourceType.Created;

  const queryView = getQueryValue(queryParams.inventoryView);
  const [storedView, setStoredView] = useLocalStorage<DevelopmentItemsView>(
    INVENTORY_VIEW_STORAGE_KEY,
    DEFAULT_INVENTORY_VIEW,
  );
  const view: DevelopmentItemsView = isDevelopmentItemsView(queryView)
    ? queryView
    : isDevelopmentItemsView(storedView)
      ? storedView
      : DEFAULT_INVENTORY_VIEW;
  const query = getQueryValue(queryParams.inventoryQuery) ?? '';
  const page = getPage(getQueryValue(queryParams.inventoryPage));
  const pageSize = getPageSize(getQueryValue(queryParams.inventoryPageSize));
  const effectivePageSize =
    isArchived && !LEGACY_ARCHIVED_PAGE_SIZE_OPTION_SET.has(pageSize)
      ? LEGACY_ARCHIVED_DEFAULT_PAGE_SIZE
      : pageSize;
  const pageToken = getQueryValue(queryParams.inventoryPageToken);
  const scope = useMemo(() => buildCreatorInventoryScope(userId, groupId), [groupId, userId]);
  const [searchInput, setSearchInput] = useState(query);
  const [pageTokens, setPageTokens] = useState<ReadonlyMap<number, string | undefined>>(
    () =>
      new Map<number, string | undefined>([
        [0, undefined],
        [page, pageToken],
      ]),
  );
  const currentPage = pageTokens.has(page) ? page : 0;
  const currentPageToken = pageTokens.has(page) ? pageToken : undefined;
  const [archiveStateOverrides, setArchiveStateOverrides] = useState<
    ReadonlyMap<number, NonNullable<DevelopmentItemsInventoryItem['state']>>
  >(() => new Map());
  const [optimisticArchivedItems, setOptimisticArchivedItems] = useState<
    ReadonlyMap<number, DevelopmentItemsInventoryItem>
  >(() => new Map());

  const resetPagination = useCallback(() => {
    setPageTokens(new Map([[0, undefined]]));
  }, []);

  const updateQuery = useCallback(
    (
      values: Partial<Record<(typeof INVENTORY_QUERY_KEYS)[number], string | number | null>>,
      resetPage = true,
    ) => {
      if (resetPage) {
        resetPagination();
      }
      setQueryParams(
        {
          ...values,
          ...(resetPage ? { inventoryPage: null, inventoryPageToken: null } : {}),
        },
        { skipHistory: true },
      );
    },
    [resetPagination, setQueryParams],
  );

  const commitSearch = useCallback(
    (value: string) => {
      if (isArchived && value.trim().length > 0) {
        setIsArchived(false);
      }
      updateQuery({ inventoryQuery: value.trim() || null });
    },
    [isArchived, setIsArchived, updateQuery],
  );

  const activeInventoryQuery = useDevelopmentItemsInventory({
    assetType,
    pageSize,
    pageToken: currentPageToken,
    query,
    scope: isArchived ? undefined : scope,
    source,
  });
  const archivedInventoryQuery = useLegacyArchivedDevelopmentItemsInventory({
    assetType,
    enabled: isArchived && scope != null,
    groupId,
    pageSize: effectivePageSize,
    pageToken: currentPageToken,
  });
  const inventoryQuery = isArchived ? archivedInventoryQuery : activeInventoryQuery;
  const { refetch: refetchInventory } = inventoryQuery;
  const handleRetry = useCallback(() => {
    void refetchInventory();
  }, [refetchInventory]);
  const handleArchiveStateChange = useCallback(
    (
      item: DevelopmentItemsInventoryItem,
      state: NonNullable<DevelopmentItemsInventoryItem['state']>,
    ) => {
      setArchiveStateOverrides((currentOverrides) => {
        const nextOverrides = new Map(currentOverrides);
        nextOverrides.set(item.assetId, state);
        return nextOverrides;
      });
      setOptimisticArchivedItems((currentItems) => {
        const nextItems = new Map(currentItems);
        if (state === 'Archived') {
          nextItems.set(item.assetId, { ...item, state });
        } else {
          nextItems.delete(item.assetId);
        }
        return nextItems;
      });
      void refetchInventory();
    },
    [refetchInventory],
  );
  const availablePageTokens = useMemo(() => {
    const nextTokens = new Map(pageTokens);
    const nextPageToken = inventoryQuery.data?.nextPageToken;
    if (nextPageToken != null) {
      nextTokens.set(currentPage + 1, nextPageToken);
    }
    return nextTokens;
  }, [currentPage, inventoryQuery.data?.nextPageToken, pageTokens]);

  /* oxlint-disable react/react-compiler -- server responses intentionally reconcile the local optimistic archive state */
  useEffect(() => {
    const queriedItems = inventoryQuery.data?.items;
    if (queriedItems == null) {
      return;
    }

    setArchiveStateOverrides((currentOverrides) => {
      let nextOverrides: Map<number, NonNullable<DevelopmentItemsInventoryItem['state']>> | null =
        null;
      queriedItems.forEach((item) => {
        if (currentOverrides.get(item.assetId) === item.state) {
          nextOverrides ??= new Map(currentOverrides);
          nextOverrides.delete(item.assetId);
        }
      });
      return nextOverrides ?? currentOverrides;
    });

    if (isArchived) {
      const indexedAssetIds = new Set(queriedItems.map((item) => item.assetId));
      setOptimisticArchivedItems((currentItems) => {
        const nextItems = new Map(currentItems);
        indexedAssetIds.forEach((assetId) => nextItems.delete(assetId));
        return nextItems.size === currentItems.size ? currentItems : nextItems;
      });
    }
  }, [inventoryQuery.data?.items, isArchived]);
  /* oxlint-enable react/react-compiler */

  const items = useMemo(() => {
    const queriedItems = inventoryQuery.data?.items ?? [];
    const mergedItems = isArchived
      ? mergeOptimisticArchivedDevelopmentItems(queriedItems, optimisticArchivedItems, assetType)
      : queriedItems;
    const inventoryItems = mergedItems.map((item) => {
      const overriddenState = archiveStateOverrides.get(item.assetId);
      return overriddenState == null || overriddenState === item.state
        ? item
        : { ...item, state: overriddenState };
    });
    return filterDevelopmentItemsByArchivedState(inventoryItems, isArchived);
  }, [
    archiveStateOverrides,
    assetType,
    inventoryQuery.data?.items,
    isArchived,
    optimisticArchivedItems,
  ]);
  const assetIds = useMemo(() => items.map((item) => item.assetId), [items]);
  const archiveCandidateAssetIds = useMemo(
    () =>
      items
        .filter((item) => isDevelopmentItemDirectlyArchivable(item.assetType))
        .map((item) => item.assetId),
    [items],
  );
  const { data: activeArchivableAssetIds } = useDevelopmentItemArchivableAssetIds(
    isArchived ? [] : archiveCandidateAssetIds,
  );
  const archivableAssetIds = isArchived
    ? (archivedInventoryQuery.data?.archivableAssetIds ?? EMPTY_ARCHIVABLE_ASSET_IDS)
    : (activeArchivableAssetIds ?? EMPTY_ARCHIVABLE_ASSET_IDS);
  const { data: thumbnailUrls = EMPTY_THUMBNAIL_URLS } = useDevelopmentItemThumbnailUrls(assetIds);

  const getAssetTypeLabel = useCallback(
    (item: DevelopmentItemsInventoryItem) => {
      if (item.assetType == null) {
        return translate('Label.Unknown');
      }
      return translate(assetTypeLabelKeys[item.assetType]);
    },
    [translate],
  );

  const getSourceLabel = useCallback(
    (item: DevelopmentItemsInventoryItem) => {
      const labels = item.sources.map((itemSource) => sourceLabels[itemSource]);
      return labels.length > 0 ? labels.join(', ') : translate('Label.Unknown');
    },
    [sourceLabels, translate],
  );

  const handleSelectItem = useCallback(
    (item: DevelopmentItemsInventoryItem) => {
      const configureUrl = creatorHub.dashboard.getConfigureCreatorStoreItemUrl(item.assetId);
      void router.push(addPublishingConsolidationReturnTo(configureUrl, router.asPath));
    },
    [router],
  );

  const assetTypeOptions = useMemo(
    () =>
      developmentItemsAssetTypes.map((option) => ({
        label: translate(assetTypeLabelKeys[option]),
        value: option,
      })),
    [translate],
  );
  const scopedSearchOptions = useMemo<DevelopmentItemsSearchScope[]>(
    () =>
      developmentItemsAssetTypes.map((option) => ({
        label: translate(assetTypeLabelKeys[option]),
        value: option,
      })),
    [translate],
  );
  const sourceOptions = useMemo(
    () =>
      [
        DevelopmentItemsSourceFilter.All,
        CreatorInventorySourceType.Created,
        CreatorInventorySourceType.Purchased,
        CreatorInventorySourceType.Shared,
      ].map((option) => ({ label: sourceLabels[option], value: option })),
    [sourceLabels],
  );

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
  }, []);
  const handleClearSearch = useCallback(() => {
    setSearchInput('');
    commitSearch('');
  }, [commitSearch]);
  const handleDismissSearch = useCallback(() => {
    setSearchInput(query);
  }, [query]);
  const getSuggestionLabel = useCallback(
    (value: string, selectedScope: DevelopmentItemsSearchScope) =>
      searchSuggestion(value, selectedScope.label),
    [searchSuggestion],
  );
  const handleSelectSearchScope = useCallback(
    (selectedScope: DevelopmentItemsSearchScope, value: string) => {
      if (!isDevelopmentItemsAssetTypeSelection(selectedScope.value)) {
        return;
      }
      setSearchInput(value);
      if (isArchived) {
        setIsArchived(false);
      }
      updateQuery({
        activeTab: selectedScope.value,
        inventoryQuery: value,
      });
    },
    [isArchived, setIsArchived, updateQuery],
  );
  const handleAssetTypeChange = useCallback(
    (value: string) => {
      if (isDevelopmentItemsAssetTypeSelection(value)) {
        updateQuery({ activeTab: value });
      }
    },
    [updateQuery],
  );
  const sheetFilters = useMemo<DevelopmentItemsSheetFilters>(
    () => ({ showArchived: isArchived, source }),
    [isArchived, source],
  );
  const applySheetFilters = useCallback(
    (filters: DevelopmentItemsSheetFilters) => {
      const sourceChanged = filters.source !== source;
      const archiveStatusChanged = filters.showArchived !== isArchived;
      if (!sourceChanged && !archiveStatusChanged) {
        return;
      }

      const queryUpdates: Partial<
        Record<(typeof INVENTORY_QUERY_KEYS)[number], string | number | null>
      > = {};
      if (sourceChanged) {
        queryUpdates.inventorySource =
          filters.source === CreatorInventorySourceType.Created ? null : filters.source;
      }
      if (archiveStatusChanged && filters.showArchived) {
        setSearchInput('');
        queryUpdates.inventoryQuery = null;
      }

      updateQuery(queryUpdates);
      if (archiveStatusChanged) {
        setIsArchived(filters.showArchived);
      }
    },
    [isArchived, setIsArchived, source, updateQuery],
  );
  const resetSheetFilters = useCallback(() => {
    applySheetFilters(DEFAULT_SHEET_FILTERS);
  }, [applySheetFilters]);
  const clearSourceFilter = useCallback(() => {
    applySheetFilters({
      ...sheetFilters,
      source: DEFAULT_SHEET_FILTERS.source,
    });
  }, [applySheetFilters, sheetFilters]);
  const clearArchivedFilter = useCallback(() => {
    applySheetFilters({
      ...sheetFilters,
      showArchived: false,
    });
  }, [applySheetFilters, sheetFilters]);
  const activeSheetFilterChips = useMemo<DevelopmentItemsActiveFilterChip[]>(() => {
    const chips: DevelopmentItemsActiveFilterChip[] = [];
    if (!isArchived && source !== DEFAULT_SHEET_FILTERS.source) {
      chips.push({
        id: 'inventory-source',
        label: inventorySourceFilter(sourceLabels[source]),
        onClear: clearSourceFilter,
      });
    }
    if (isArchived) {
      chips.push({
        id: 'inventory-archived',
        label: translate('Label.Archived'),
        onClear: clearArchivedFilter,
      });
    }
    return chips;
  }, [
    clearArchivedFilter,
    clearSourceFilter,
    inventorySourceFilter,
    isArchived,
    source,
    sourceLabels,
    translate,
  ]);
  const handleViewChange = useCallback(
    (value: string) => {
      if (isDevelopmentItemsView(value)) {
        setStoredView(value);
        updateQuery({ inventoryView: value }, false);
      }
    },
    [setStoredView, updateQuery],
  );
  const hasActiveFilters = hasActiveDevelopmentItemsInventoryFilters({
    query,
    showArchived: isArchived,
    source,
  });

  const inventoryPagination = useMemo<DevelopmentItemsPaginationProps>(
    () => ({
      hasNextPage: inventoryQuery.data?.nextPageToken != null,
      itemCount: items.length,
      labels: {
        firstPage: translations.firstPage,
        lastPage: translations.lastPage,
        nextPage: translations.nextPage,
        previousPage: translations.previousPage,
        range: (start: number, end: number, total: number, hasNextPage: boolean) =>
          hasNextPage
            ? `${start}-${end}`
            : translate('Label.PageRange', {
                pageRange: `${start}-${end}`,
                totalPageCount: `${total}`,
              }),
        rowsPerPage: translations.rowsPerPage,
      },
      onPageChange: (nextPage: number, nextPageToken?: string) => {
        setPageTokens(new Map(availablePageTokens));
        updateQuery(
          {
            inventoryPage: nextPage === 0 ? null : nextPage,
            inventoryPageToken: nextPageToken ?? null,
          },
          false,
        );
      },
      onRowsPerPageChange: (nextPageSize: number) => {
        updateQuery({
          inventoryPageSize:
            nextPageSize === (isArchived ? LEGACY_ARCHIVED_DEFAULT_PAGE_SIZE : DEFAULT_PAGE_SIZE)
              ? null
              : nextPageSize,
        });
      },
      page: currentPage,
      pageSize: effectivePageSize,
      pageTokens: availablePageTokens,
      rowsPerPageOptions: isArchived ? LEGACY_ARCHIVED_PAGE_SIZE_OPTIONS : PAGE_SIZE_OPTIONS,
    }),
    [
      availablePageTokens,
      currentPage,
      effectivePageSize,
      inventoryQuery.data?.nextPageToken,
      isArchived,
      items.length,
      translate,
      translations.firstPage,
      translations.lastPage,
      translations.nextPage,
      translations.previousPage,
      translations.rowsPerPage,
      updateQuery,
    ],
  );

  return (
    <div
      className={clsx(
        'flex flex-col gap-large width-full min-width-0',
        useTabNavigationSpacing ? 'padding-top-xlarge' : 'padding-top-small',
      )}>
      <DevelopmentItemsToolbar
        assetTypeControl={
          <InventoryFilterDropdown
            ariaLabel={translations.assetType}
            className={FILTER_DROPDOWN_CLASS}
            onChange={handleAssetTypeChange}
            options={assetTypeOptions}
            value={assetType}
          />
        }
        filterControl={
          <DevelopmentItemsFilterSheet
            applyLabel={translate('Action.Apply')}
            archiveFilter={{
              activeLabel: translate('Label.Active'),
              archivedLabel: translate('Label.Archived'),
              sectionLabel: translate('Label.Status'),
            }}
            closeLabel={translate('Action.Close')}
            defaultFilters={DEFAULT_SHEET_FILTERS}
            filters={sheetFilters}
            onFiltersChange={applySheetFilters}
            resetLabel={translate('Action.ResetAll')}
            sourceLabel={translations.inventorySource}
            sourceOptions={sourceOptions}
            title={translations.filterBy}
            triggerLabel={translations.filterBy}
          />
        }
        searchControl={
          <DevelopmentItemsScopedSearch
            ariaLabel={translations.search}
            clearLabel={translations.clearSearch}
            getSuggestionLabel={getSuggestionLabel}
            onChange={handleSearchChange}
            onClear={handleClearSearch}
            onCommit={commitSearch}
            onDismiss={handleDismissSearch}
            onSelectScope={handleSelectSearchScope}
            placeholder={translations.search}
            scopes={scopedSearchOptions}
            suggestionsLabel={translations.searchWithinAssetType}
            value={searchInput}
          />
        }
        viewControl={
          <SegmentedControl
            aria-label={translations.viewSelector}
            className='shrink-0 !padding-x-none'
            fillBehaviour='Hug'
            fillStyle='Utility'
            items={viewItems}
            onValueChange={handleViewChange}
            size='Medium'
            value={view}
            variant='Icon'
          />
        }
      />
      <DevelopmentItemsActiveFiltersRow
        chips={activeSheetFilterChips}
        clearFilterLabel={translations.clearFilter}
        onReset={resetSheetFilters}
        resetLabel={translate('Action.ResetAll')}
      />

      {scope == null && (
        <Alert hasCloseAffordance={false} severity='Error' variant='Feedback'>
          <span>
            <strong>{translations.unavailable}</strong> {translations.unavailableDescription}
          </span>
        </Alert>
      )}

      {scope != null && inventoryQuery.isPending && (
        <div className='flex justify-center items-center padding-y-xxlarge'>
          <ProgressCircle ariaLabel={translations.loading} size='Large' variant='Indeterminate' />
        </div>
      )}

      {scope != null && inventoryQuery.isError && (
        <Alert
          hasCloseAffordance={false}
          onPrimaryAction={handleRetry}
          primaryActionLabel={translations.retry}
          severity='Error'
          variant='Feedback'>
          <span>
            <strong>{translations.unavailable}</strong> {translations.unavailableDescription}
          </span>
        </Alert>
      )}

      {scope != null && inventoryQuery.isSuccess && items.length === 0 && !hasActiveFilters && (
        <DevelopmentItemsLegacyEntryPoints assetType={assetType} hasItems={false} />
      )}

      {scope != null && inventoryQuery.isSuccess && items.length === 0 && hasActiveFilters && (
        <DevelopmentItemsEmptyState
          {...(!isArchived && query.length > 0
            ? {
                actionLabel: translations.clearSearch,
                onAction: handleClearSearch,
              }
            : {})}
          description={translations.noItemsDescription}
          title={translations.noItems}
        />
      )}

      {!isArchived && scope != null && inventoryQuery.isSuccess && items.length > 0 && (
        <DevelopmentItemsLegacyEntryPoints assetType={assetType} hasItems />
      )}

      {scope != null && inventoryQuery.isSuccess && items.length > 0 && view === 'grid' && (
        <DevelopmentItemsGrid
          archivableAssetIds={archivableAssetIds}
          items={items}
          onArchiveStateChange={handleArchiveStateChange}
          onSelectItem={handleSelectItem}
          thumbnailUrls={thumbnailUrls}
        />
      )}

      {scope != null && inventoryQuery.isSuccess && items.length > 0 && view === 'list' && (
        <DevelopmentItemsList
          archivableAssetIds={archivableAssetIds}
          getAssetTypeLabel={getAssetTypeLabel}
          getSourceLabel={getSourceLabel}
          items={items}
          labels={{
            actions: translations.actions,
            assetId: translations.assetId,
            assetType: translations.assetType,
            lastUpdated: translations.lastUpdated,
            name: translations.name,
            source: translations.inventorySource,
          }}
          onArchiveStateChange={handleArchiveStateChange}
          onSelectItem={handleSelectItem}
          pagination={inventoryPagination}
          thumbnailUrls={thumbnailUrls}
        />
      )}

      {scope != null && inventoryQuery.isSuccess && (view === 'grid' || items.length === 0) && (
        <DevelopmentItemsPagination {...inventoryPagination} />
      )}
    </div>
  );
};

export default withTranslation(DevelopmentItemsInventory, [
  TranslationNamespace.AssetTypes,
  TranslationNamespace.Controls,
  TranslationNamespace.Creations,
  TranslationNamespace.Error,
  TranslationNamespace.Navigation,
  TranslationNamespace.Table,
]);
