import { type FC, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { TextFilterProvider } from '@modules/experience-analytics-shared/text-filter/TextFilterContext';
import InternalSandboxBanner from '../../components/InternalSandboxBanner';
import { CUSTOM_DASHBOARDS_LEARN_MORE_HREF } from '../../constants/docsLinks';
import { customDashboardQueryKeys } from '../../hooks/customDashboardsQueryConfig';
import { useDashboardsListQuery } from '../../hooks/useDashboardsListQuery';
import {
  type UserDisplayNamesById,
  useUserDisplayNamesQuery,
} from '../../hooks/useUserDisplayNamesQuery';
import {
  useCanMutateCustomDashboards,
  useCustomDashboardsBackendState,
} from '../../service/CustomDashboardServiceProvider';
import { filterCustomDashboardText } from '../../textFilter';
import { MAX_PINNED_DASHBOARDS } from '../../types';
import type { CustomDashboardListItem } from '../../types';
import { readMaxDashboardsPerUniverse } from '../../utils/readMaxDashboardsPerUniverse';
import type { EditorWorkingCopy } from '../../workingCopy/editorWorkingCopy';
import DashboardsEmptyState from './components/DashboardsEmptyState';
import DashboardsErrorState from './components/DashboardsErrorState';
import DashboardsNoMatchesState from './components/DashboardsNoMatchesState';
import DashboardsSearchInput from './components/DashboardsSearchInput';
import DashboardsTable from './components/DashboardsTable';
import DashboardsTablePagination from './components/DashboardsTablePagination';
import DeleteDashboardConfirmDialog from './components/DeleteDashboardConfirmDialog';
import ManagePageHeaderStack from './components/ManagePageHeaderStack';
import RenameDashboardDialog from './components/RenameDashboardDialog';
import StorageFailureToastSlot from './components/StorageFailureToastSlot';
import { useDashboardActions } from './hooks/useDashboardActions';
import { useFilteredAndPagedDashboards } from './hooks/useFilteredAndPagedDashboards';
import { useManagePageState } from './hooks/useManagePageState';

const EMPTY_USER_DISPLAY_NAMES: UserDisplayNamesById = new Map();
/**
 * Manage page render-state machine. Mounts inside `CustomDashboardsShell`,
 * derives the list query / filter / pagination, and dispatches row mutations
 * to `useDashboardActions`.
 */
type ManagePageContentProps = {
  readonly universeId: number;
  readonly onOpenDashboard: (dashboard: CustomDashboardListItem) => void;
  readonly onEditDashboard: (dashboard: CustomDashboardListItem) => void;
  readonly onDashboardCreated: (workingCopy: EditorWorkingCopy) => void;
};

const ManagePageContent: FC<ManagePageContentProps> = ({
  universeId,
  onOpenDashboard,
  onEditDashboard,
  onDashboardCreated,
}) => {
  const queryClient = useQueryClient();
  const filterText = useMemo(() => filterCustomDashboardText(universeId), [universeId]);
  const pageState = useManagePageState();
  const { page, setPage, setTokenForPage } = pageState;
  const canMutateDashboards = useCanMutateCustomDashboards();
  const { isApiBacked } = useCustomDashboardsBackendState();
  const listQuery = useDashboardsListQuery(
    universeId,
    isApiBacked
      ? {
          pageSize: pageState.pageSize,
          pageToken: pageState.pageToken,
        }
      : undefined,
  );
  // Root (un-paged) list for the global pinned count. API-backed paging only
  // loads one page into `listQuery`; the pinned cap spans all dashboards, so
  // we read the full list here. This shares the side nav's cache (same root
  // query key), so when the side nav has already loaded it there's no extra
  // fetch. The hook is always called (Rules of Hooks); `enabled` gates it to
  // API-backed so non-API-backed reuses `listQuery` (already the root key)
  // without a redundant observer.
  const rootListQuery = useDashboardsListQuery(universeId, { enabled: isApiBacked });

  const serverItems = listQuery.data?.items;
  const localItems = listQuery.data?.localItems;
  const totalLoaded = (serverItems?.length ?? 0) + (localItems?.length ?? 0);
  const filterIsActive = pageState.searchQuery.trim().length > 0;
  const nextPageToken = listQuery.data?.nextPageToken;
  const { isStale: isListStale } = listQuery;

  // Resolve display names for the full loaded set before filtering so the
  // search can match the creator name the row actually displays. API-backed
  // rows carry an unresolved username sentinel (or a blank username); their
  // visible creator name is the display name resolved from `createdByUserId`,
  // so the lookup must span the unfiltered list — not just the rendered page.
  const attributionUserIds = useMemo(
    () =>
      [...(serverItems ?? []), ...(localItems ?? [])].flatMap((dashboard) => [
        dashboard.createdByUserId,
        dashboard.updatedByUserId ?? dashboard.createdByUserId,
      ]),
    [serverItems, localItems],
  );
  const userDisplayNamesQuery = useUserDisplayNamesQuery(attributionUserIds);
  // Attribution names enhance the persisted metadata. While they load, or if
  // the lookup fails, rows (and the search filter) fall back to the stored
  // username.
  const userDisplayNamesById = userDisplayNamesQuery.isSuccess
    ? userDisplayNamesQuery.data
    : EMPTY_USER_DISPLAY_NAMES;

  const { pagedItems: serverPagedItems, filteredCount: serverFilteredCount } =
    useFilteredAndPagedDashboards(
      serverItems,
      pageState.searchQuery,
      isApiBacked ? 1 : pageState.page,
      pageState.pageSize,
      userDisplayNamesById,
    );

  const { pagedItems: localPagedItems, filteredCount: localFilteredCount } =
    useFilteredAndPagedDashboards(
      localItems,
      pageState.searchQuery,
      1,
      Number.MAX_SAFE_INTEGER,
      userDisplayNamesById,
    );
  const displayedItems = useMemo(
    () => [...localPagedItems, ...serverPagedItems],
    [localPagedItems, serverPagedItems],
  );
  // Pinned count for the cap. Non-API-backed: `listQuery` already holds the
  // full list (root key) — `rootListQuery` is disabled and has no data, so we
  // fall back to `serverItems`. API-backed: `rootListQuery` holds the full
  // list. Hybrid local copies are never pinnable (their pin toggle is
  // disabled), so excluding them from the count keeps the cap accurate to
  // what the side nav actually surfaces.
  const pinnedCount = useMemo(() => {
    const fullList = isApiBacked ? rootListQuery.data?.items : serverItems;
    return (fullList ?? []).filter((d) => d.isPinned && d.hybridOrigin !== 'localCopy').length;
  }, [isApiBacked, rootListQuery.data?.items, serverItems]);

  const hasNextPage = Boolean(nextPageToken);
  let totalPages = Math.max(1, Math.ceil(serverFilteredCount / pageState.pageSize));
  if (isApiBacked) {
    totalPages = hasNextPage ? pageState.page + 1 : pageState.page;
  }
  const totalCount = isApiBacked ? undefined : serverFilteredCount;

  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: customDashboardQueryKeys.list(universeId) });
  }, [queryClient, universeId]);

  const {
    handlers,
    confirmDelete,
    cancelDelete,
    confirmDeleteSubmit,
    confirmRename,
    cancelRename,
    confirmRenameSubmit,
    handleCreate,
    writeError,
    clearWriteError,
  } = useDashboardActions({
    universeId,
    onOpenDashboard,
    onEditDashboard,
    onDashboardCreated,
    pinnedCount,
  });

  const onCreateClick = useCallback(() => {
    // `handleCreate` swallows its own errors into `writeError`; the
    // returned Promise never rejects, so we deliberately fire-and-forget.
    void handleCreate();
  }, [handleCreate]);

  const isUniverseReady = universeId > 0;
  // Disabled queries report `isLoading: false` in RQ v5; `isPending` stays
  // true until the first fetch, and we treat an uninitialized universe id
  // as loading so the empty state never exposes Create prematurely.
  const isLoading =
    !isUniverseReady ||
    listQuery.isPending ||
    (listQuery.isFetching && listQuery.data === undefined);
  // Distinct error branch so a load failure doesn't fall through to
  // `isInitialEmpty` and render the Create CTA.
  const isError = !isLoading && listQuery.isError;
  // Hybrid lists always include `localItems`. Create/createAndPublish write
  // to localStorage, so the server cap/count must not disable that path.
  const isHybridLocalWrite = localItems !== undefined;
  const maxDashboardsPerUniverse = readMaxDashboardsPerUniverse(
    listQuery.data?.capabilities ?? rootListQuery.data?.capabilities,
  );
  // API-backed paging loads one page into `listQuery`; the cap spans all
  // server dashboards, so wait for the root list before enabling Create.
  const isRootListPendingForCap =
    isApiBacked &&
    !isHybridLocalWrite &&
    (rootListQuery.isPending || (rootListQuery.isFetching && rootListQuery.data === undefined));
  const dashboardCountForCap = isHybridLocalWrite
    ? localItems.length
    : isApiBacked
      ? (rootListQuery.data?.items.length ?? 0)
      : (serverItems?.length ?? 0);
  const isAtDashboardCap =
    maxDashboardsPerUniverse !== undefined && dashboardCountForCap >= maxDashboardsPerUniverse;
  const isCreateEnabled =
    isUniverseReady &&
    !isLoading &&
    !isError &&
    !isRootListPendingForCap &&
    canMutateDashboards &&
    !isAtDashboardCap;
  // Only page 1 (no page token) can be "initial empty" — i.e. the universe
  // genuinely has no dashboards. An empty page 2+ means the user paginated
  // past the last page (spurious token or items deleted between loads);
  // that must render an empty table + Previous button, not the Create CTA.
  const isInitialEmpty =
    !isLoading && !isError && totalLoaded === 0 && pageState.page === 1 && !pageState.pageToken;
  const isNoMatches =
    !isLoading &&
    !isError &&
    totalLoaded > 0 &&
    filterIsActive &&
    serverFilteredCount + localFilteredCount === 0;
  const isPopulated = !isLoading && !isError && !isInitialEmpty && !isNoMatches;

  const migrationFailedCount = listQuery.data?.migrationFailedCount ?? 0;
  const refetchList = listQuery.refetch;

  const handleListRetry = useCallback(() => {
    refetchList().catch(() => undefined);
  }, [refetchList]);

  const handleDeleteConfirm = useCallback(() => {
    void confirmDeleteSubmit();
  }, [confirmDeleteSubmit]);

  const handleRenameConfirm = useCallback(
    (nextName: string) => {
      void confirmRenameSubmit(nextName);
    },
    [confirmRenameSubmit],
  );

  const handlePageChange = useCallback(
    (nextPage: number) => {
      // Client-side pagination only slices the root query. Reobserve a stale
      // list after navigation so a deferred pin/unpin reorder is applied.
      if (!isApiBacked && nextPage !== page && isListStale) {
        void refetchList();
      }
      if (nextPage === page + 1 && nextPageToken) {
        setTokenForPage(nextPage, nextPageToken);
      }
      setPage(nextPage);
    },
    [isApiBacked, isListStale, nextPageToken, page, refetchList, setPage, setTokenForPage],
  );

  const renderTable = (): React.ReactElement => {
    if (isLoading) {
      return <DashboardsTable mode={{ kind: 'loading', skeletonRowCount: pageState.pageSize }} />;
    }
    if (isError) {
      return (
        <DashboardsTable
          mode={{
            kind: 'custom',
            content: <DashboardsErrorState error={listQuery.error} onRetry={handleListRetry} />,
          }}
        />
      );
    }
    if (isNoMatches) {
      return (
        <DashboardsTable
          mode={{
            kind: 'custom',
            content: <DashboardsNoMatchesState onClearSearch={pageState.clearSearchQuery} />,
          }}
        />
      );
    }
    return (
      <DashboardsTable
        mode={{
          kind: 'populated',
          items: displayedItems,
          handlers,
          canMutateDashboards,
          userDisplayNamesById,
          pinnedCount,
          maxPinnedDashboards: MAX_PINNED_DASHBOARDS,
        }}
      />
    );
  };

  const showSearchSlot = isLoading || isPopulated || isNoMatches;
  const showPagination =
    isLoading ||
    (isPopulated && ((serverItems?.length ?? 0) > 0 || hasNextPage || pageState.page > 1));

  const deletingDashboard = confirmDelete.status === 'idle' ? null : confirmDelete.dashboard;
  const isDeleteSubmitting = confirmDelete.status === 'submitting';
  const renamingDashboard = confirmRename.status === 'idle' ? null : confirmRename.dashboard;
  const isRenameSubmitting = confirmRename.status === 'submitting';

  return (
    <TextFilterProvider filterText={filterText}>
      <main className='flex grow flex-col gap-large medium:gap-xxlarge padding-x-medium medium:padding-x-large padding-y-medium medium:padding-y-large min-height-0 min-width-0 bg-surface-0'>
        <StorageFailureToastSlot
          universeId={universeId}
          migrationFailedCount={migrationFailedCount}
          listError={listQuery.error}
          writeError={writeError}
          onClearWriteError={clearWriteError}
        />

        <ManagePageHeaderStack
          learnMoreHref={CUSTOM_DASHBOARDS_LEARN_MORE_HREF}
          isCreateEnabled={isCreateEnabled}
          onCreateClick={onCreateClick}
          onRefresh={refresh}
          maxDashboardsPerUniverse={maxDashboardsPerUniverse}
        />

        <InternalSandboxBanner />

        {isInitialEmpty ? (
          <div className='flex grow flex-col min-height-0 min-width-0 width-full'>
            <DashboardsEmptyState isCreateEnabled={isCreateEnabled} onCreateClick={onCreateClick} />
          </div>
        ) : (
          <>
            {showSearchSlot ? (
              <DashboardsSearchInput
                value={pageState.searchQuery}
                onChange={pageState.setSearchQuery}
                onClear={pageState.clearSearchQuery}
                disabled={isLoading}
              />
            ) : null}

            {renderTable()}

            {showPagination ? (
              <DashboardsTablePagination
                page={pageState.page}
                pageSize={pageState.pageSize}
                totalPages={totalPages}
                totalCount={totalCount}
                disabled={isLoading}
                onPageChange={handlePageChange}
                onPageSizeChange={pageState.setPageSize}
              />
            ) : null}
          </>
        )}
      </main>

      <DeleteDashboardConfirmDialog
        dashboard={deletingDashboard}
        isSubmitting={isDeleteSubmitting}
        onCancel={cancelDelete}
        onConfirm={handleDeleteConfirm}
      />

      <RenameDashboardDialog
        key={renamingDashboard?.id ?? 'rename-closed'}
        dashboard={renamingDashboard}
        isSubmitting={isRenameSubmitting}
        onCancel={cancelRename}
        onConfirm={handleRenameConfirm}
      />
    </TextFilterProvider>
  );
};

export default ManagePageContent;
