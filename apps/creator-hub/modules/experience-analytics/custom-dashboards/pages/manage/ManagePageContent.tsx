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
import type { CustomDashboardListItem } from '../../types';
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

  const serverItems = listQuery.data?.items;
  const localItems = listQuery.data?.localItems;
  const totalLoaded = (serverItems?.length ?? 0) + (localItems?.length ?? 0);
  const filterIsActive = pageState.searchQuery.trim().length > 0;
  const nextPageToken = listQuery.data?.nextPageToken;

  const { pagedItems: serverPagedItems, filteredCount: serverFilteredCount } =
    useFilteredAndPagedDashboards(
      serverItems,
      pageState.searchQuery,
      isApiBacked ? 1 : pageState.page,
      pageState.pageSize,
    );

  const { pagedItems: localPagedItems, filteredCount: localFilteredCount } =
    useFilteredAndPagedDashboards(localItems, pageState.searchQuery, 1, Number.MAX_SAFE_INTEGER);
  const displayedItems = useMemo(
    () => [...localPagedItems, ...serverPagedItems],
    [localPagedItems, serverPagedItems],
  );
  const attributionUserIds = useMemo(
    () =>
      displayedItems.flatMap((dashboard) => [
        dashboard.createdByUserId,
        dashboard.updatedByUserId ?? dashboard.createdByUserId,
      ]),
    [displayedItems],
  );
  const userDisplayNamesQuery = useUserDisplayNamesQuery(attributionUserIds);
  // Attribution names enhance the persisted metadata. While they load, or if
  // the lookup fails, rows continue to render their stored username fallback.
  const userDisplayNamesById = userDisplayNamesQuery.isSuccess
    ? userDisplayNamesQuery.data
    : EMPTY_USER_DISPLAY_NAMES;

  const hasNextPage = Boolean(nextPageToken);
  let totalPages = Math.max(1, Math.ceil(serverFilteredCount / pageState.pageSize));
  if (isApiBacked) {
    totalPages = hasNextPage ? pageState.page + 1 : pageState.page;
  }
  const rangeStart = serverFilteredCount === 0 ? 0 : (pageState.page - 1) * pageState.pageSize + 1;
  const rangeEnd =
    serverFilteredCount === 0
      ? 0
      : (pageState.page - 1) * pageState.pageSize + serverPagedItems.length;
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
  const isCreateEnabled = isUniverseReady && !isLoading && !isError && canMutateDashboards;
  const isInitialEmpty = !isLoading && !isError && totalLoaded === 0;
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
      if (nextPage === page + 1 && nextPageToken) {
        setTokenForPage(nextPage, nextPageToken);
      }
      setPage(nextPage);
    },
    [nextPageToken, page, setPage, setTokenForPage],
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
        }}
      />
    );
  };

  const showSearchSlot = isLoading || isPopulated || isNoMatches;
  const showPagination =
    isLoading || (isPopulated && ((serverItems?.length ?? 0) > 0 || hasNextPage));

  const deletingDashboard = confirmDelete.status === 'idle' ? null : confirmDelete.dashboard;
  const isDeleteSubmitting = confirmDelete.status === 'submitting';
  const renamingDashboard = confirmRename.status === 'idle' ? null : confirmRename.dashboard;
  const isRenameSubmitting = confirmRename.status === 'submitting';

  return (
    <TextFilterProvider filterText={filterCustomDashboardText}>
      <div className='flex grow flex-col gap-large medium:gap-xxlarge padding-x-medium medium:padding-x-large padding-y-medium medium:padding-y-large min-height-0 min-width-0'>
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
              />
            ) : null}

            {renderTable()}

            {showPagination ? (
              <DashboardsTablePagination
                page={pageState.page}
                pageSize={pageState.pageSize}
                totalPages={totalPages}
                rangeStart={rangeStart}
                rangeEnd={rangeEnd}
                totalCount={totalCount}
                disabled={isLoading}
                onPageChange={handlePageChange}
                onPageSizeChange={pageState.setPageSize}
              />
            ) : null}
          </>
        )}
      </div>

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
