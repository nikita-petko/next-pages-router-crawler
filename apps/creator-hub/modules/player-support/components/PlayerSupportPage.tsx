import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { useRouter } from 'next/router';
import { downloadBlob } from '@rbx/core';
import { useFlag } from '@rbx/flags';
import { Icon, ProgressCircle, Tabs, TabsList, TabsTrigger } from '@rbx/foundation-ui';
import { withTranslation, useTranslation } from '@rbx/intl';
import { useDebounce } from '@rbx/react-utilities';
import { useMediaQuery, type TTheme } from '@rbx/ui';
import { enablePlayerSupportSearchAndFilters } from '@generated/flags/creatorGameops';
import useLocale from '@modules/charts-generic/context/useLocale';
import GenericTablePagination from '@modules/charts-generic/tables/GenericTablePagination';
import { TicketStatus, type CreatorTicketSummary } from '@modules/clients/creatorCommunication';
import { getResponseFromError } from '@modules/clients/utils';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import LoadError from '@modules/miscellaneous/error/LoadError';
import useQueryParams from '@modules/miscellaneous/hooks/useQueryParams';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  TableSelectionProvider,
  useTableSelectionStoreInstance,
} from '@modules/monetization-shared/table-selection/context';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import {
  isPlayerSupportCategoryFilter,
  isPlayerSupportViewFilter,
  PLAYER_SUPPORT_SEARCH_DEBOUNCE_DELAY_MS,
  PLAYER_SUPPORT_VIEW_FILTER_VALUES,
  PlayerSupportCategoryFilter,
  PlayerSupportViewFilter,
} from '../constants/ticketFilters';
import usePlayerSupportExportMutation from '../hooks/usePlayerSupportExportMutation';
import usePlayerSupportTicketsQuery from '../hooks/usePlayerSupportTicketsQuery';
import {
  generatePlayerSupportCsv,
  getPlayerSupportExportFilename,
} from '../utils/playerSupportCsv';
import { getSelectedTicketIds, getTicketId, isTicketSelectable } from '../utils/ticketSelection';
import PlayerSupportBulkActions from './PlayerSupportBulkActions';
import PlayerSupportExportMenu, {
  PlayerSupportExportScope,
  type PlayerSupportExportResult,
} from './PlayerSupportExportMenu';
import PlayerSupportTable from './PlayerSupportTable';
import PlayerSupportToolbar from './PlayerSupportToolbar';

const QUERY_PARAM_KEYS = ['pageToken', 'pageSize', 'status', 'query', 'view', 'category'] as const;
const DEFAULT_PAGE_SIZE = 20;
const PAGE_SIZE_OPTIONS = [10, 20, 50];

const getPrevTokensStorageKey = (universeId: number, status: TicketStatus) =>
  `playerSupport:prevTokens:${universeId}:${status}`;

const readPrevTokens = (universeId: number, status: TicketStatus): string[] => {
  try {
    const raw = sessionStorage.getItem(getPrevTokensStorageKey(universeId, status));
    if (!raw) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.every((t): t is string => typeof t === 'string') ? parsed : [];
  } catch {
    return [];
  }
};

const writePrevTokens = (universeId: number, status: TicketStatus, tokens: string[]) => {
  try {
    const key = getPrevTokensStorageKey(universeId, status);
    if (tokens.length === 0) {
      sessionStorage.removeItem(key);
    } else {
      sessionStorage.setItem(key, JSON.stringify(tokens));
    }
  } catch {
    // sessionStorage may be unavailable (e.g. private browsing quota exceeded)
  }
};

const PlayerSupportPage: React.FunctionComponent = () => {
  const { translate } = useTranslation();
  const { gameDetails } = useCurrentGame();
  const universeId = gameDetails?.id ?? 0;
  const { value: isSearchAndFiltersEnabled } = useFlag(enablePlayerSupportSearchAndFilters);
  const isMobile = useMediaQuery((theme: TTheme) => theme.breakpoints.down('Medium'));
  const locale = useLocale();
  const router = useRouter();
  const { mutateAsync: exportTickets, isPending: isExporting } = usePlayerSupportExportMutation();

  const [queryParams, setQueryParams] = useQueryParams(QUERY_PARAM_KEYS, {
    scroll: false,
  });

  const pageToken = typeof queryParams.pageToken === 'string' ? queryParams.pageToken : undefined;
  const pageSize = queryParams.pageSize ? Number(queryParams.pageSize) : DEFAULT_PAGE_SIZE;
  const selectedStatus =
    queryParams.status === TicketStatus.Archived ? TicketStatus.Archived : TicketStatus.NeedsAction;
  const query =
    isSearchAndFiltersEnabled && typeof queryParams.query === 'string' ? queryParams.query : '';
  const selectedView =
    isSearchAndFiltersEnabled && isPlayerSupportViewFilter(queryParams.view)
      ? queryParams.view
      : PlayerSupportViewFilter.All;
  const selectedCategory =
    isSearchAndFiltersEnabled && isPlayerSupportCategoryFilter(queryParams.category)
      ? queryParams.category
      : PlayerSupportCategoryFilter.All;
  const [searchState, setSearchState] = useState(() => ({
    externalValue: query,
    inputValue: query,
  }));
  if (query !== searchState.externalValue) {
    setSearchState({ externalValue: query, inputValue: query });
  }
  const search = searchState.inputValue;
  const normalizedSearch = search.trim();
  const debouncedQuery = useDebounce(normalizedSearch, PLAYER_SUPPORT_SEARCH_DEBOUNCE_DELAY_MS);
  const isSearchPending = normalizedSearch !== debouncedQuery;
  const readFilter = PLAYER_SUPPORT_VIEW_FILTER_VALUES[selectedView];
  const categoryFilter =
    selectedCategory === PlayerSupportCategoryFilter.All ? undefined : selectedCategory;
  const hasActiveFilters =
    normalizedSearch.length > 0 ||
    selectedView !== PlayerSupportViewFilter.All ||
    selectedCategory !== PlayerSupportCategoryFilter.All;

  // Scopes the selection and the card layout's selection mode to the rows they were made
  // on, so neither survives a new query, page, or layout.
  const ticketPageKey = `${isMobile ? 'mobile' : 'desktop'}:${isSearchAndFiltersEnabled ? 'bulk' : 'basic'}:${selectedStatus}:${pageToken ?? ''}:${pageSize}:${debouncedQuery}:${selectedView}:${selectedCategory}`;
  const [selectionModePageKey, setSelectionModePageKey] = useState<string | undefined>(undefined);
  const isMobileSelectionMode = selectionModePageKey === ticketPageKey;

  const [prevTokens, setPrevTokens] = useState<string[]>(() =>
    readPrevTokens(universeId, selectedStatus),
  );

  // Keep prevTokens in sync with the URL across browser back/forward and hard refreshes.
  // On hard refresh, universeId starts as 0 so useState reads the wrong sessionStorage key;
  // this effect re-reads once the real universeId is available.
  // Read the current length via a ref so this only re-runs for URL-driven inputs; otherwise
  // explicit next/prev clicks would race with the router (router.query updates async) and
  // wrongly rewind prevTokens before the URL catches up.
  const prevTokensRef = useRef(prevTokens);
  // oxlint-disable-next-line react/react-compiler -- intentional render-time ref sync so the effect below can read the latest prevTokens without listing it as a dependency (see comment above re: router race)
  prevTokensRef.current = prevTokens;
  useEffect(() => {
    const storedTokens = readPrevTokens(universeId, selectedStatus);
    const currentLength = prevTokensRef.current.length;
    if (!pageToken) {
      if (currentLength > 0) {
        setPrevTokens([]);
        writePrevTokens(universeId, selectedStatus, []);
      }
      return;
    }
    const idx = storedTokens.indexOf(pageToken);
    if (idx !== -1) {
      const corrected = storedTokens.slice(0, idx);
      if (corrected.length !== currentLength) {
        setPrevTokens(corrected);
        writePrevTokens(universeId, selectedStatus, corrected);
      }
    } else if (storedTokens.length !== currentLength) {
      setPrevTokens(storedTokens);
    }
  }, [pageToken, universeId, selectedStatus]);

  // Log a single page-view event once the experience id is available, regardless of
  // how the user arrived (left nav, direct link, in-app navigation).
  const hasLoggedPageViewRef = useRef(false);
  useEffect(() => {
    if (universeId > 0 && !hasLoggedPageViewRef.current) {
      hasLoggedPageViewRef.current = true;
      unifiedLoggerClient.logImpressionEvent({
        eventName: 'playerSupport.pageView',
        parameters: {
          universeId: String(universeId),
        },
      });
    }
  }, [universeId]);

  const { data, isPending, isPlaceholderData, error, refetch } = usePlayerSupportTicketsQuery({
    universeId,
    status: selectedStatus,
    query: debouncedQuery || undefined,
    readFilter,
    category: categoryFilter,
    pageToken,
    pageSize,
    shouldKeepPreviousData: true,
  });

  const isNotFoundError = getResponseFromError(error)?.status === 404;

  const ticketSummaries = data?.creatorTicketSummaries;
  const tickets = useMemo(() => ticketSummaries ?? [], [ticketSummaries]);
  const currentPageTicketIds = useMemo(
    () => tickets.flatMap(({ creatorTicketId }) => (creatorTicketId ? [creatorTicketId] : [])),
    [tickets],
  );
  const nextPageToken = data?.nextPageToken;
  // Older service builds omit the total, which reads as an empty result set.
  const totalMatchedCount = data?.totalMatchedCount ?? 0;

  // Owned above both the toolbar and the table so the bulk actions can take the filters'
  // place rather than pushing the rows down from inside the table.
  const selectionStore = useTableSelectionStoreInstance<string, CreatorTicketSummary>(
    { identifier: getTicketId, selectable: isTicketSelectable },
    { currentPage: tickets, items: tickets, mode: 'page' },
  );
  const selectionSnapshot = useSyncExternalStore(
    selectionStore.subscribe,
    selectionStore.getSnapshot,
  );
  const selectedTicketIds = useMemo(
    () => getSelectedTicketIds(selectionSnapshot.data.items, selectionSnapshot.selectedMap),
    [selectionSnapshot],
  );
  const isSelectionMode =
    Boolean(isSearchAndFiltersEnabled) &&
    (isMobile ? isMobileSelectionMode : selectedTicketIds.length > 0);

  useEffect(() => {
    selectionStore.reset();
  }, [selectionStore, ticketPageKey]);

  // ES can return a nextPageToken even when the following page has no results.
  // Prefetch that page and only enable forward pagination when it has results.
  const { data: nextPageData } = usePlayerSupportTicketsQuery({
    universeId,
    status: selectedStatus,
    query: debouncedQuery || undefined,
    readFilter,
    category: categoryFilter,
    pageToken: nextPageToken,
    pageSize,
    enabled: !!nextPageToken && !isPlaceholderData,
  });

  const hasNextPage = !!nextPageToken && (nextPageData?.creatorTicketSummaries ?? []).length > 0;

  const resetPagination = useCallback(() => {
    writePrevTokens(universeId, selectedStatus, []);
    setPrevTokens([]);
  }, [selectedStatus, universeId]);

  const handleNextPage = useCallback(() => {
    if (!nextPageToken) {
      return;
    }
    setPrevTokens((prev) => {
      const next = [...prev, pageToken ?? ''];
      writePrevTokens(universeId, selectedStatus, next);
      return next;
    });
    setQueryParams({ pageToken: nextPageToken });
  }, [nextPageToken, pageToken, setQueryParams, universeId, selectedStatus]);

  const handlePrevPage = useCallback(() => {
    setPrevTokens((prev) => {
      const next = [...prev];
      const token = next.pop();
      writePrevTokens(universeId, selectedStatus, next);
      const prevPageToken = token === undefined || token === '' ? null : token;
      setQueryParams({ pageToken: prevPageToken });
      return next;
    });
  }, [setQueryParams, universeId, selectedStatus]);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchState((current) => ({ ...current, inputValue: value }));
      resetPagination();
      setQueryParams(
        {
          query: value.trim().length > 0 ? value : null,
          pageToken: null,
        },
        { skipHistory: true },
      );
    },
    [resetPagination, setQueryParams],
  );

  const handleViewChange = useCallback(
    (value: typeof selectedView) => {
      resetPagination();
      setQueryParams(
        {
          view: value === PlayerSupportViewFilter.All ? null : value,
          pageToken: null,
        },
        { skipHistory: true },
      );
    },
    [resetPagination, setQueryParams],
  );

  const handleCategoryChange = useCallback(
    (value: typeof selectedCategory) => {
      resetPagination();
      setQueryParams(
        {
          category: value === PlayerSupportCategoryFilter.All ? null : value,
          pageToken: null,
        },
        { skipHistory: true },
      );
    },
    [resetPagination, setQueryParams],
  );

  const handleClearFilters = useCallback(() => {
    setSearchState((current) => ({ ...current, inputValue: '' }));
    resetPagination();
    setQueryParams(
      {
        query: null,
        view: null,
        category: null,
        pageToken: null,
      },
      { skipHistory: true },
    );
  }, [resetPagination, setQueryParams]);

  const handleStatusChange = useCallback(
    (status: TicketStatus) => {
      unifiedLoggerClient.logClickEvent({
        eventName: 'playerSupport.tabSwitch',
        parameters: {
          universeId: String(universeId),
          tab: status === TicketStatus.Archived ? 'archived' : 'needsAction',
        },
      });
      resetPagination();
      setQueryParams({ status, pageToken: null });
    },
    [resetPagination, setQueryParams, universeId],
  );

  const handleTabValueChange = useCallback(
    (value: string) => {
      handleStatusChange(
        value === TicketStatus.Archived ? TicketStatus.Archived : TicketStatus.NeedsAction,
      );
    },
    [handleStatusChange],
  );

  const handlePageSizeChange = useCallback(
    (newPageSize: number) => {
      resetPagination();
      setQueryParams({ pageSize: newPageSize, pageToken: null }, { skipHistory: true });
    },
    [resetPagination, setQueryParams],
  );

  const handleTicketClick = useCallback(
    (ticketId: string, ticketCategory?: string) => {
      unifiedLoggerClient.logClickEvent({
        eventName: 'playerSupport.openTicket',
        parameters: {
          universeId: String(universeId),
          ticketId,
          ticketCategory: ticketCategory ?? '',
          status: selectedStatus === TicketStatus.Archived ? 'archived' : 'needsAction',
          isMobile: String(isMobile),
        },
      });
      const pathUniverseId = typeof router.query.id === 'string' ? router.query.id : '';
      void router.push(
        `/dashboard/creations/experiences/${pathUniverseId}/player-support/${ticketId}`,
      );
    },
    [router, universeId, selectedStatus, isMobile],
  );

  // Exporting mid-debounce would send a query the visible rows don't reflect yet.
  const canExport =
    universeId > 0 &&
    currentPageTicketIds.length > 0 &&
    !isSearchPending &&
    !isPlaceholderData &&
    error === null;

  const handleExport = useCallback(
    async (scope: PlayerSupportExportScope): Promise<PlayerSupportExportResult> => {
      const exportsAllMatches = scope === PlayerSupportExportScope.All;
      const creatorTicketIds =
        scope === PlayerSupportExportScope.Selected ? selectedTicketIds : currentPageTicketIds;
      const response = await exportTickets({
        universeId,
        creatorTicketIds: exportsAllMatches ? undefined : creatorTicketIds,
        query: exportsAllMatches ? debouncedQuery || undefined : undefined,
        readFilter: exportsAllMatches ? readFilter : undefined,
        categories:
          exportsAllMatches && categoryFilter !== undefined ? [categoryFilter] : undefined,
        statuses: exportsAllMatches ? [selectedStatus] : undefined,
      });
      const csv = generatePlayerSupportCsv(response.rows ?? []);
      const exportBlob = new Blob([new TextEncoder().encode(csv)], {
        type: 'text/csv;charset=utf-8',
      });
      downloadBlob(exportBlob, getPlayerSupportExportFilename(universeId));

      return { truncated: response.truncated === true };
    },
    [
      categoryFilter,
      currentPageTicketIds,
      debouncedQuery,
      exportTickets,
      readFilter,
      selectedStatus,
      selectedTicketIds,
      universeId,
    ],
  );

  const handleEnterSelectionMode = useCallback(() => {
    setSelectionModePageKey(ticketPageKey);
  }, [ticketPageKey]);

  const handleExitSelectionMode = useCallback(() => {
    setSelectionModePageKey(undefined);
  }, []);

  // The card layout hosts both itself: the export sits beside its `Select` button, and
  // the bulk actions pin to the viewport, leaving the toolbar row nothing to hold.
  const exportMenu = (
    <PlayerSupportExportMenu
      selectedCount={selectedTicketIds.length}
      currentPageCount={currentPageTicketIds.length}
      allCount={totalMatchedCount}
      hasActiveFilters={hasActiveFilters}
      isDisabled={!canExport || isExporting}
      onExport={handleExport}
    />
  );
  const bulkActions = (
    <PlayerSupportBulkActions
      universeId={universeId}
      selectedStatus={selectedStatus}
      isMobile={isMobile}
      onExitSelectionMode={handleExitSelectionMode}
    />
  );

  const noRequestsFoundTitle = translate('Description.PlayerSupport.NoFilteredSupportRequests');
  const noRequestsFoundDescription = translate(
    'Description.PlayerSupport.NoFilteredSupportRequestsDesc',
  );

  return (
    <>
      {isPending && (
        <div className='justify-center padding-xlarge margin-top-large flex'>
          <ProgressCircle
            variant='Indeterminate'
            size='Medium'
            ariaLabel={translate('Label.AriaLabel.LoadingTickets')}
          />
        </div>
      )}
      {!isPending && isNotFoundError && (
        <div className='items-center padding-xlarge margin-top-large gap-medium flex flex-col'>
          <div className='padding-bottom-large'>
            <div className='relative items-center justify-center size-2500 flex'>
              <div className='absolute opacity-[0.16] size-2500 stroke-standard [border-color:var(--color-content-emphasis)] [border-radius:5px] [transform:rotate(-15deg)]' />
              <Icon name='icon-regular-envelope' className='content-emphasis !size-1800' />
            </div>
          </div>
          <div className='items-center text-align-x-center gap-small flex flex-col'>
            <span className='content-emphasis text-heading-small'>
              {translate('Description.PlayerSupport.NoSupportRequests')}
            </span>
            <span className='content-default text-body-medium'>
              {translate('Description.PlayerSupport.NoSupportRequestsDescription')}
            </span>
          </div>
        </div>
      )}
      {!isPending && !isNotFoundError && (
        <TableSelectionProvider store={selectionStore}>
          <div className='flex flex-col'>
            <div className='width-full [box-shadow:inset_0_calc(-1*var(--stroke-thick))_0_var(--color-stroke-muted)]'>
              <Tabs
                value={selectedStatus}
                onValueChange={handleTabValueChange}
                variant='Inlined'
                fitBehavior='Fit'>
                <TabsList>
                  <TabsTrigger
                    value={TicketStatus.NeedsAction}
                    className='width-[137px] !padding-y-none'>
                    {translate('Label.TicketFilter.SupportRequests')}
                  </TabsTrigger>
                  <TabsTrigger
                    value={TicketStatus.Archived}
                    className='width-[137px] !padding-y-none'>
                    {translate('Label.TicketFilter.ArchivedRequests')}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            {isSearchAndFiltersEnabled && (
              <PlayerSupportToolbar
                search={search}
                view={selectedView}
                category={selectedCategory}
                isSelectionMode={isSelectionMode}
                onSearchChange={handleSearchChange}
                onViewChange={handleViewChange}
                onCategoryChange={handleCategoryChange}
                onClearFilters={handleClearFilters}
                bulkActions={isMobile ? undefined : bulkActions}
                trailingActions={isMobile ? undefined : exportMenu}
              />
            )}
            {isPlaceholderData && (
              <div className='justify-center padding-xlarge margin-top-large flex'>
                <ProgressCircle
                  variant='Indeterminate'
                  size='Medium'
                  ariaLabel={translate('Label.AriaLabel.LoadingTickets')}
                />
              </div>
            )}
            {!isPlaceholderData && error && (
              <LoadError
                onReload={() => {
                  void refetch();
                }}
              />
            )}
            {!isPlaceholderData && !error && tickets.length > 0 ? (
              <>
                <PlayerSupportTable
                  key={ticketPageKey}
                  tickets={tickets}
                  universeId={universeId}
                  locale={locale}
                  isMobile={isMobile}
                  isBulkManagementEnabled={Boolean(isSearchAndFiltersEnabled)}
                  isSelectionMode={isSelectionMode}
                  onTicketClick={handleTicketClick}
                  onEnterSelectionMode={handleEnterSelectionMode}
                  bulkActions={isMobile ? bulkActions : undefined}
                  trailingActions={isMobile ? exportMenu : undefined}
                />
                <table className='width-full'>
                  <tfoot>
                    <tr>
                      <GenericTablePagination
                        page={prevTokens.length}
                        pageSize={pageSize}
                        pageSizeOptions={PAGE_SIZE_OPTIONS}
                        setPageSize={handlePageSizeChange}
                        onNextPage={handleNextPage}
                        onPreviousPage={handlePrevPage}
                        hasNext={hasNextPage}
                        hasPrevious={prevTokens.length > 0}
                      />
                    </tr>
                  </tfoot>
                </table>
              </>
            ) : null}
            {!isPlaceholderData && !error && tickets.length === 0 && (
              <div className='items-center padding-xlarge margin-top-large gap-medium flex flex-col'>
                <div className='padding-bottom-large'>
                  <div className='relative items-center justify-center size-2500 flex'>
                    <div
                      className='absolute size-2500 stroke-standard'
                      style={{
                        transform: 'rotate(-15deg)',
                        borderStyle: 'solid',
                        borderColor: 'var(--color-content-emphasis)',
                        borderRadius: 5,
                        opacity: 0.16,
                      }}
                    />
                    <Icon name='icon-regular-envelope' className='content-emphasis !size-1800' />
                  </div>
                </div>
                <div className='items-center text-align-x-center gap-xsmall flex flex-col'>
                  <span className='content-emphasis text-heading-small'>
                    {hasActiveFilters
                      ? noRequestsFoundTitle
                      : translate(
                          selectedStatus === TicketStatus.Archived
                            ? 'Description.PlayerSupport.NoArchivedSupportRequests'
                            : 'Description.PlayerSupport.NoNeedsActionSupportRequests',
                        )}
                  </span>
                  <span className='content-default text-body-medium'>
                    {hasActiveFilters
                      ? noRequestsFoundDescription
                      : translate(
                          selectedStatus === TicketStatus.Archived
                            ? 'Description.PlayerSupport.NoArchivedSupportRequestsDesc'
                            : 'Description.PlayerSupport.NoNeedsActionSupportRequestsDesc',
                        )}
                  </span>
                </div>
              </div>
            )}
          </div>
        </TableSelectionProvider>
      )}
    </>
  );
};

export default withTranslation(PlayerSupportPage, [TranslationNamespace.PlayerFeedback]);
