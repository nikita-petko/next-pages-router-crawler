import { useCallback, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthentication } from '@modules/authentication/providers';
import { customDashboardQueryKeys } from '../../../hooks/customDashboardsQueryConfig';
import { useCustomDashboardService } from '../../../service/CustomDashboardServiceProvider';
import type { CustomDashboardListItem, CustomDashboardListResult } from '../../../types';
import { sortDashboardsForList } from '../../../utils/sortDashboards';
import {
  createNewEditorWorkingCopy,
  type EditorWorkingCopy,
} from '../../../workingCopy/editorWorkingCopy';

/**
 * Composes every row-level mutation the manage page exposes into a single hook.
 *
 * Optimistic: pin / unpin / rename mutate the cache before the service call
 * resolves, then invalidate the list on failure so a stale snapshot cannot
 * clobber a newer optimistic update. The service-subscription bridge
 * invalidates the list on success so the canonical truth always wins on the
 * next refetch.
 *
 * Pessimistic: duplicate / delete / create wait for the service call. Create
 * only allocates an in-memory editor working copy; first save in the editor
 * persists it via `createAndPublish`.
 */
type ConfirmingDelete =
  | { readonly status: 'idle' }
  | { readonly status: 'awaiting'; readonly dashboard: CustomDashboardListItem }
  | { readonly status: 'submitting'; readonly dashboard: CustomDashboardListItem };

type ConfirmingRename =
  | { readonly status: 'idle' }
  | { readonly status: 'awaiting'; readonly dashboard: CustomDashboardListItem }
  | { readonly status: 'submitting'; readonly dashboard: CustomDashboardListItem };

export type DashboardActionHandlers = {
  readonly onOpen: (dashboard: CustomDashboardListItem) => void;
  readonly onEdit: (dashboard: CustomDashboardListItem) => void;
  readonly onRename: (dashboard: CustomDashboardListItem) => void;
  readonly onDuplicate: (dashboard: CustomDashboardListItem) => void;
  readonly onDelete: (dashboard: CustomDashboardListItem) => void;
  readonly onPinToggle: (dashboard: CustomDashboardListItem, nextPinned: boolean) => void;
};

type UseDashboardActionsArgs = {
  readonly universeId: number;
  readonly onOpenDashboard: (dashboard: CustomDashboardListItem) => void;
  readonly onEditDashboard: (dashboard: CustomDashboardListItem) => void;
  /** Fires after an unsaved editor working copy is created; the route component navigates from here. */
  readonly onDashboardCreated: (workingCopy: EditorWorkingCopy) => void;
};

type UseDashboardActionsResult = {
  readonly handlers: DashboardActionHandlers;
  readonly confirmDelete: ConfirmingDelete;
  readonly cancelDelete: () => void;
  readonly confirmDeleteSubmit: () => Promise<void>;
  readonly confirmRename: ConfirmingRename;
  readonly cancelRename: () => void;
  readonly confirmRenameSubmit: (nextName: string) => Promise<void>;
  readonly handleCreate: () => Promise<void>;
  readonly writeError: unknown;
  readonly clearWriteError: () => void;
};

export function useDashboardActions({
  universeId,
  onOpenDashboard,
  onEditDashboard,
  onDashboardCreated,
}: UseDashboardActionsArgs): UseDashboardActionsResult {
  const service = useCustomDashboardService();
  const queryClient = useQueryClient();
  const { user } = useAuthentication();

  const [confirmDelete, setConfirmDelete] = useState<ConfirmingDelete>({ status: 'idle' });
  const [confirmRename, setConfirmRename] = useState<ConfirmingRename>({ status: 'idle' });
  const [writeError, setWriteError] = useState<unknown>(null);

  const listQueryKey = customDashboardQueryKeys.list(universeId);

  const invalidateList = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: listQueryKey });
  }, [queryClient, listQueryKey]);

  const replaceItemInCache = useCallback(
    (dashboardId: string, updater: (item: CustomDashboardListItem) => CustomDashboardListItem) => {
      queryClient.setQueriesData<CustomDashboardListResult>(
        { queryKey: listQueryKey },
        (previous) => {
          if (!previous) {
            return previous;
          }
          const nextItems = previous.items.map((item) =>
            item.id === dashboardId ? updater(item) : item,
          );
          const nextLocalItems = previous.localItems?.map((item) =>
            item.id === dashboardId ? updater(item) : item,
          );
          return {
            ...previous,
            items: sortDashboardsForList(nextItems),
            localItems: nextLocalItems
              ? sortDashboardsForList(nextLocalItems)
              : previous.localItems,
          };
        },
      );
    },
    [queryClient, listQueryKey],
  );

  const removeItemFromCache = useCallback(
    (dashboardId: string) => {
      queryClient.setQueriesData<CustomDashboardListResult>(
        { queryKey: listQueryKey },
        (previous) => {
          if (!previous) {
            return previous;
          }
          return {
            ...previous,
            items: previous.items.filter((item) => item.id !== dashboardId),
            localItems: previous.localItems?.filter((item) => item.id !== dashboardId),
          };
        },
      );
    },
    [queryClient, listQueryKey],
  );

  const optimisticUpdate = useCallback(
    async (
      dashboardId: string,
      patch: (item: CustomDashboardListItem) => CustomDashboardListItem,
      run: () => Promise<unknown>,
    ): Promise<void> => {
      replaceItemInCache(dashboardId, patch);
      try {
        await run();
      } catch (error) {
        invalidateList();
        setWriteError(error);
      }
    },
    [invalidateList, replaceItemInCache],
  );

  const handlePinToggle = useCallback(
    (dashboard: CustomDashboardListItem, nextPinned: boolean) => {
      // Don't synthesize `pinnedAt` here — we'd need the service's clock,
      // not wall-clock time, and the cache invalidates on success so the
      // canonical timestamp wins on the next refetch. The visual change
      // (`isPinned`) is the only thing the user sees in the optimistic
      // frame.
      optimisticUpdate(
        dashboard.id,
        (item) => ({ ...item, isPinned: nextPinned }),
        () =>
          nextPinned
            ? service.pin(universeId, dashboard.id)
            : service.unpin(universeId, dashboard.id),
      ).catch(() => undefined);
    },
    [optimisticUpdate, service, universeId],
  );

  const handleDuplicate = useCallback(
    (dashboard: CustomDashboardListItem) => {
      if (!user) {
        setWriteError(
          new Error(
            "Can't duplicate this dashboard yet — user information hasn't finished loading.",
          ),
        );
        return;
      }
      service
        .duplicate(universeId, dashboard.id, {
          createdByUserId: user.id,
          createdByUsername: user.name,
        })
        .catch((error: unknown) => {
          setWriteError(error);
        });
    },
    [service, universeId, user],
  );

  const handleEdit = useCallback(
    (dashboard: CustomDashboardListItem) => {
      if (dashboard.hybridOrigin !== 'server' || !service.forkApiDashboardToLocal) {
        onEditDashboard(dashboard);
        return;
      }
      if (!user) {
        setWriteError(
          new Error("Can't create a local copy yet — user information hasn't finished loading."),
        );
        return;
      }
      service
        .forkApiDashboardToLocal(universeId, dashboard.id, {
          createdByUserId: user.id,
          createdByUsername: user.name,
        })
        .then(onEditDashboard)
        .catch((error: unknown) => {
          setWriteError(error);
        });
    },
    [onEditDashboard, service, universeId, user],
  );

  const handleDelete = useCallback((dashboard: CustomDashboardListItem) => {
    setConfirmDelete({ status: 'awaiting', dashboard });
  }, []);

  const cancelDelete = useCallback(() => {
    setConfirmDelete((state) => (state.status === 'submitting' ? state : { status: 'idle' }));
  }, []);

  const confirmDeleteSubmit = useCallback(async () => {
    if (confirmDelete.status !== 'awaiting') {
      return;
    }
    const { dashboard } = confirmDelete;
    setConfirmDelete({ status: 'submitting', dashboard });
    removeItemFromCache(dashboard.id);
    try {
      await service.delete(universeId, dashboard.id);
      setConfirmDelete({ status: 'idle' });
    } catch (error) {
      invalidateList();
      setConfirmDelete({ status: 'idle' });
      setWriteError(error);
    }
  }, [confirmDelete, invalidateList, removeItemFromCache, service, universeId]);

  const handleRename = useCallback((dashboard: CustomDashboardListItem) => {
    setConfirmRename({ status: 'awaiting', dashboard });
  }, []);

  const cancelRename = useCallback(() => {
    setConfirmRename((state) => (state.status === 'submitting' ? state : { status: 'idle' }));
  }, []);

  const confirmRenameSubmit = useCallback(
    async (nextName: string) => {
      if (confirmRename.status !== 'awaiting') {
        return;
      }
      const { dashboard } = confirmRename;
      const trimmed = nextName.trim();
      if (trimmed === dashboard.name.trim()) {
        setConfirmRename({ status: 'idle' });
        return;
      }
      setConfirmRename({ status: 'submitting', dashboard });
      replaceItemInCache(dashboard.id, (item) => ({
        ...item,
        name: trimmed,
      }));
      try {
        await service.update(universeId, dashboard.id, { name: trimmed });
        setConfirmRename({ status: 'idle' });
      } catch (error) {
        invalidateList();
        setConfirmRename({ status: 'idle' });
        setWriteError(error);
      }
    },
    [confirmRename, invalidateList, replaceItemInCache, service, universeId],
  );

  const handleCreate = useCallback(async () => {
    if (!user) {
      setWriteError(
        new Error("Can't create a dashboard yet — user information hasn't finished loading."),
      );
      return;
    }
    try {
      const suggestedName = await service.suggestDefaultName(universeId);
      const workingCopy = createNewEditorWorkingCopy({
        universeId,
        name: suggestedName,
        createdByUserId: user.id,
        createdByUsername: user.name,
      });
      onDashboardCreated(workingCopy);
    } catch (error) {
      setWriteError(error);
    }
  }, [service, universeId, user, onDashboardCreated]);

  const clearWriteError = useCallback(() => {
    setWriteError(null);
  }, []);

  const handlers: DashboardActionHandlers = useMemo(
    () => ({
      onOpen: onOpenDashboard,
      onEdit: handleEdit,
      onRename: handleRename,
      onDuplicate: handleDuplicate,
      onDelete: handleDelete,
      onPinToggle: handlePinToggle,
    }),
    [handleDelete, handleDuplicate, handleEdit, handlePinToggle, handleRename, onOpenDashboard],
  );

  return {
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
  };
}
