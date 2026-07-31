import type { FunctionComponent } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { clsx, FeedbackBanner, ProgressCircle, SegmentedControl } from '@rbx/foundation-ui';
import type { TSegmentedControlIconItem } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import {
  CreatorInventoryAssetType,
  CreatorInventorySourceType,
} from '@modules/clients/creatorInventory';
import { useQueryParams } from '@modules/miscellaneous/hooks';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { creatorHub } from '@modules/miscellaneous/urls';
import { addPublishingConsolidationReturnTo } from '../../common/utils/publishingConsolidationNavigation';
import DevelopmentItemsActiveFiltersRow from './components/DevelopmentItemsActiveFiltersRow';
import type { DevelopmentItemsActiveFilterChip } from './components/DevelopmentItemsActiveFiltersRow';
import DevelopmentItemsEmptyState from './components/DevelopmentItemsEmptyState';
import DevelopmentItemsFilterSheet from './components/DevelopmentItemsFilterSheet';
import type { DevelopmentItemsSheetFilters } from './components/DevelopmentItemsFilterSheet';
import DevelopmentItemsGrid from './components/DevelopmentItemsGrid';
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
  isDevelopmentItemsAssetTypeSelection,
  isDevelopmentItemsSourceSelection,
  isDevelopmentItemsView,
  type DevelopmentItemsAssetTypeSelection,
  type DevelopmentItemsInventoryItem,
  type DevelopmentItemsSourceSelection,
  type DevelopmentItemsView,
} from './developmentItemsInventoryUtils';
import useDevelopmentItemsInventory, {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
} from './useDevelopmentItemsInventory';
import useDevelopmentItemsInventoryTranslations from './useDevelopmentItemsInventoryTranslations';
import useDevelopmentItemThumbnailUrls from './useDevelopmentItemThumbnailUrls';

const INVENTORY_QUERY_KEYS = [
  'activeTab',
  'inventoryPage',
  'inventoryPageSize',
  'inventoryPageToken',
  'inventoryQuery',
  'inventorySource',
  'inventoryView',
] as const;

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
const EMPTY_THUMBNAIL_URLS: ReadonlyMap<number, string> = new Map();
const PAGE_SIZE_OPTION_SET = new Set<number>(PAGE_SIZE_OPTIONS);

const DEFAULT_SHEET_FILTERS: DevelopmentItemsSheetFilters = {
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
  const view: DevelopmentItemsView = isDevelopmentItemsView(queryView) ? queryView : 'grid';
  const query = getQueryValue(queryParams.inventoryQuery) ?? '';
  const page = getPage(getQueryValue(queryParams.inventoryPage));
  const pageSize = getPageSize(getQueryValue(queryParams.inventoryPageSize));
  const pageToken = getQueryValue(queryParams.inventoryPageToken);
  const scope = useMemo(() => buildCreatorInventoryScope(userId, groupId), [groupId, userId]);
  const [searchInput, setSearchInput] = useState(query);
  const [pageTokens, setPageTokens] = useState<ReadonlyMap<number, string | undefined>>(
    () => new Map([[0, undefined]]),
  );

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
      updateQuery({ inventoryQuery: value.trim() || null });
    },
    [updateQuery],
  );

  const inventoryQuery = useDevelopmentItemsInventory({
    assetType,
    pageSize,
    pageToken,
    query,
    scope,
    source,
  });
  const { refetch: refetchInventory } = inventoryQuery;
  const handleRetry = useCallback(() => {
    void refetchInventory();
  }, [refetchInventory]);
  const availablePageTokens = useMemo(() => {
    const nextTokens = new Map(pageTokens);
    const nextPageToken = inventoryQuery.data?.nextPageToken;
    if (nextPageToken != null) {
      nextTokens.set(page + 1, nextPageToken);
    }
    return nextTokens;
  }, [inventoryQuery.data?.nextPageToken, page, pageTokens]);

  const items = useMemo(() => inventoryQuery.data?.items ?? [], [inventoryQuery.data?.items]);
  const assetIds = useMemo(() => items.map((item) => item.assetId), [items]);
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
      updateQuery({
        activeTab: selectedScope.value,
        inventoryQuery: value,
      });
    },
    [updateQuery],
  );
  const handleAssetTypeChange = useCallback(
    (value: string) => {
      if (isDevelopmentItemsAssetTypeSelection(value)) {
        updateQuery({ activeTab: value });
      }
    },
    [updateQuery],
  );
  const handleSourceChange = useCallback(
    (value: string) => {
      if (isDevelopmentItemsSourceSelection(value)) {
        updateQuery({
          inventorySource: value === CreatorInventorySourceType.Created ? null : value,
        });
      }
    },
    [updateQuery],
  );
  const sheetFilters = useMemo<DevelopmentItemsSheetFilters>(() => ({ source }), [source]);
  const applySheetFilters = useCallback(
    (filters: DevelopmentItemsSheetFilters) => {
      handleSourceChange(filters.source);
    },
    [handleSourceChange],
  );
  const resetSheetFilters = useCallback(() => {
    applySheetFilters(DEFAULT_SHEET_FILTERS);
  }, [applySheetFilters]);
  const activeSheetFilterChips = useMemo<DevelopmentItemsActiveFilterChip[]>(
    () =>
      source === DEFAULT_SHEET_FILTERS.source
        ? []
        : [
            {
              id: 'inventory-source',
              label: inventorySourceFilter(sourceLabels[source]),
              onClear: resetSheetFilters,
            },
          ],
    [inventorySourceFilter, resetSheetFilters, source, sourceLabels],
  );
  const handleViewChange = useCallback(
    (value: string) => {
      if (isDevelopmentItemsView(value)) {
        updateQuery({ inventoryView: value }, false);
      }
    },
    [updateQuery],
  );

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
          inventoryPageSize: nextPageSize === DEFAULT_PAGE_SIZE ? null : nextPageSize,
        });
      },
      page,
      pageSize,
      pageTokens: availablePageTokens,
      rowsPerPageOptions: PAGE_SIZE_OPTIONS,
    }),
    [
      availablePageTokens,
      inventoryQuery.data?.nextPageToken,
      items.length,
      page,
      pageSize,
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
            closeLabel={translate('Action.Close')}
            defaultFilters={DEFAULT_SHEET_FILTERS}
            filters={sheetFilters}
            onFiltersChange={applySheetFilters}
            resetLabel={translate('Action.ResetAll')}
            sourceLabel={translations.inventorySource}
            sourceOptions={sourceOptions}
            title={translations.filters}
            triggerLabel={translations.filter}
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
        <FeedbackBanner
          description={translations.unavailableDescription}
          severity='Error'
          showIcon
          title={translations.unavailable}
        />
      )}

      {scope != null && inventoryQuery.isPending && (
        <div className='flex justify-center items-center padding-y-xxlarge'>
          <ProgressCircle ariaLabel={translations.loading} size='Large' variant='Indeterminate' />
        </div>
      )}

      {scope != null && inventoryQuery.isError && (
        <FeedbackBanner
          description={translations.unavailableDescription}
          onPrimaryAction={handleRetry}
          primaryActionLabel={translations.retry}
          severity='Error'
          showIcon
          title={translations.unavailable}
        />
      )}

      {scope != null && inventoryQuery.isSuccess && items.length === 0 && (
        <DevelopmentItemsEmptyState
          {...(query.length > 0
            ? {
                actionLabel: translations.clearSearch,
                onAction: handleClearSearch,
              }
            : {})}
          description={translations.noItemsDescription}
          title={translations.noItems}
        />
      )}

      {scope != null && inventoryQuery.isSuccess && items.length > 0 && view === 'grid' && (
        <DevelopmentItemsGrid
          items={items}
          onSelectItem={handleSelectItem}
          thumbnailUrls={thumbnailUrls}
        />
      )}

      {scope != null && inventoryQuery.isSuccess && items.length > 0 && view === 'list' && (
        <DevelopmentItemsList
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
          onSelectItem={handleSelectItem}
          pagination={inventoryPagination}
          thumbnailUrls={thumbnailUrls}
        />
      )}

      {scope != null && inventoryQuery.isSuccess && view === 'grid' && (
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
