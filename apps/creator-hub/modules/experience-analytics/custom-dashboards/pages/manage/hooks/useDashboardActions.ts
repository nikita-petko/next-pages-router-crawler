import { useCallback, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthentication } from '@modules/authentication/providers';
import { CustomDashboardVersionConflictError } from '../../../errors';
import { customDashboardQueryKeys } from '../../../hooks/customDashboardsQueryConfig';
import { useCustomDashboardService } from '../../../service/CustomDashboardServiceProvider';
import type { CustomDashboardListItem, CustomDashboardListResult } from '../../../types';
import { MAX_PINNED_DASHBOARDS } from '../../../types';
import { sortDashboardsForList } from '../../../utils/sortDashboards';
import {
  createNewEditorWorkingCopy,
  type EditorWorkingCopy,
} from '../../../workingCopy/editorWorkingCopy';
import {
  createSerializedIntentWriter,
  type SerializedIntentWriter,
} from './createSerializedIntentWriter';

/**
 * Composes every row-level mutation the manage page exposes into a single hook.
 *
 * Optimistic: pin / unpin / rename mutate the cache before the service call
 * resolves, then invalidate the list on failure so a stale snapshot cannot
 * clobber a newer optimistic update. Pin toggles are coalesced per dashboard
 * and written one at a time so 20 clicks become at most two requests and the
 * last click is the last write. The service-subscription bridge invalidates
 * the list on success so the canonical truth always wins on the next refetch.
 *
 * Pessimistic: duplicate / delete / create wait for the service call. Create
 * only allocates an in-memory editor working copy; first save in the editor
 * persists it via `createAndPublish`.
 *
 * Write failures stay in this hook's local state (they do not live in the
 * list query), so a Manage All banner cannot leak onto edit/preview routes.
 */

export type DashboardWriteOperation = 'pin' | 'rename' | 'delete' | 'duplicate' | 'create' | 'edit';

type DashboardWriteFailure = {
  readonly error: unknown;
  readonly operation: DashboardWriteOperation;
};
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
  /** Current pinned-dashboard count, for the optimistic pin cap guard. */
  readonly pinnedCount: number;
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
  readonly writeOperation: DashboardWriteOperation | null;
  readonly clearWriteError: () => void;
};

export function useDashboardActions({
  universeId,
  onOpenDashboard,
  onEditDashboard,
  onDashboardCreated,
  pinnedCount,
}: UseDashboardActionsArgs): UseDashboardActionsResult {
  const service = useCustomDashboardService();
  const queryClient = useQueryClient();
  const { user } = useAuthentication();

  const [confirmDelete, setConfirmDelete] = useState<ConfirmingDelete>({ status: 'idle' });
  const [confirmRename, setConfirmRename] = useState<ConfirmingRename>({ status: 'idle' });
  const [writeFailure, setWriteFailure] = useState<DashboardWriteFailure | null>(null);

  const listQueryKey = customDashboardQueryKeys.list(universeId);
  const pinWritersRef = useRef(new Map<string, SerializedIntentWriter<boolean>>());
  const pinWritersUniverseRef = useRef(universeId);

  const invalidateList = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: listQueryKey });
  }, [queryClient, listQueryKey]);

  const replaceItemInCache = useCallback(
    (
      dashboardId: string,
      updater: (item: CustomDashboardListItem) => CustomDashboardListItem,
      resort = true,
    ) => {
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
            items: resort ? sortDashboardsForList(nextItems) : nextItems,
            localItems: nextLocalItems
              ? resort
                ? sortDashboardsForList(nextLocalItems)
                : nextLocalItems
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

  const getPinWriter = useCallback(
    (dashboardId: string): SerializedIntentWriter<boolean> => {
      if (pinWritersUniverseRef.current !== universeId) {
        pinWritersUniverseRef.current = universeId;
        pinWritersRef.current.clear();
      }
      const existing = pinWritersRef.current.get(dashboardId);
      if (existing) {
        return existing;
      }
      const writer = createSerializedIntentWriter<boolean>({
        write: async (isPinned) => {
          if (isPinned) {
            await service.pin(universeId, dashboardId);
          } else {
            await service.unpin(universeId, dashboardId);
          }
        },
        onSuccess: () => {
          setWriteFailure((prev) => (prev?.operation === 'pin' ? null : prev));
        },
        onError: (error) => {
          invalidateList();
          // Pin last-write-wins: a leftover 409 is recovered by refetch, not a
          // "refresh and try again" banner.
          if (error instanceof CustomDashboardVersionConflictError) {
            return;
          }
          setWriteFailure({ error, operation: 'pin' });
        },
      });
      pinWritersRef.current.set(dashboardId, writer);
      return writer;
    },
    [service, universeId, invalidateList],
  );

  const handlePinToggle = useCallback(
    (dashboard: CustomDashboardListItem, nextPinned: boolean) => {
      // Belt-and-suspenders: the UI disables the toggle at the cap, but a
      // stale cache or race could still fire a doomed pin. The service also
      // enforces the cap, but blocking here avoids a wasted optimistic flip
      // + rollback. Already-pinned rows stay pinnable (idempotent at the cap).
      if (nextPinned && pinnedCount >= MAX_PINNED_DASHBOARDS) {
        return;
      }
      // Optimistic in place: flip `isPinned` without re-sorting the cached
      // list so the row doesn't jump mid-toggle. The canonical `pinnedAt`
      // / `updatedAt` are intentionally not synthesized here — we'd need
      // the service's clock, not wall-clock time. The service-subscription
      // bridge marks the list stale (without refetching) on pin success,
      // so the reorder lands on the next page switch, remount, or manual
      // refresh rather than while the user is looking at the page.
      replaceItemInCache(dashboard.id, (item) => ({ ...item, isPinned: nextPinned }), false);
      getPinWriter(dashboard.id).submit(nextPinned);
    },
    [getPinWriter, pinnedCount, replaceItemInCache],
  );

  const handleDuplicate = useCallback(
    (dashboard: CustomDashboardListItem) => {
      if (!user) {
        setWriteFailure({
          error: new Error(
            "Can't duplicate this dashboard yet — user information hasn't finished loading.",
          ),
          operation: 'duplicate',
        });
        return;
      }
      service
        .duplicate(universeId, dashboard.id, {
          createdByUserId: user.id,
          createdByUsername: user.name,
        })
        .catch((error: unknown) => {
          setWriteFailure({ error, operation: 'duplicate' });
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
        setWriteFailure({
          error: new Error(
            "Can't create a local copy yet — user information hasn't finished loading.",
          ),
          operation: 'edit',
        });
        return;
      }
      service
        .forkApiDashboardToLocal(universeId, dashboard.id, {
          createdByUserId: user.id,
          createdByUsername: user.name,
        })
        .then(onEditDashboard)
        .catch((error: unknown) => {
          setWriteFailure({ error, operation: 'edit' });
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
      setWriteFailure(null);
    } catch (error) {
      invalidateList();
      setConfirmDelete({ status: 'idle' });
      setWriteFailure({ error, operation: 'delete' });
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
        setWriteFailure(null);
      } catch (error) {
        invalidateList();
        setConfirmRename({ status: 'idle' });
        setWriteFailure({ error, operation: 'rename' });
      }
    },
    [confirmRename, invalidateList, replaceItemInCache, service, universeId],
  );

  const handleCreate = useCallback(async () => {
    if (!user) {
      setWriteFailure({
        error: new Error(
          "Can't create a dashboard yet — user information hasn't finished loading.",
        ),
        operation: 'create',
      });
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
      setWriteFailure({ error, operation: 'create' });
    }
  }, [service, universeId, user, onDashboardCreated]);

  const clearWriteError = useCallback(() => {
    setWriteFailure(null);
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
    writeError: writeFailure?.error ?? null,
    writeOperation: writeFailure?.operation ?? null,
    clearWriteError,
  };
}
