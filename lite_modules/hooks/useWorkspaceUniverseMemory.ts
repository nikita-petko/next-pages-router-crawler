import { useWorkspaces } from '@rbx/creator-hub-navigation';
import { useCallback, useMemo } from 'react';

import useShouldUseWorkspaceUniverseFiltering from '@hooks/useShouldUseWorkspaceUniverseFiltering';
import {
  getRememberedWorkspaceUniverseId,
  rememberWorkspaceUniverseId,
  type WorkspaceIdentity,
} from '@utils/workspaceUniverseStorage';

interface WorkspaceUniverseMemory {
  rememberedUniverseId?: number;
  rememberUniverseId: (universeId: number) => void;
}

/**
 * Reads and writes the last universe the user picked in the current Creator Hub
 * workspace, so manage and create stay on the same experience as the user moves
 * between them. No-ops until the workspace resolves, and for sessions that scope
 * experiences by ad account rather than by workspace.
 */
const useWorkspaceUniverseMemory = (): WorkspaceUniverseMemory => {
  const { currentWorkspace } = useWorkspaces();
  const shouldUseWorkspaceUniverseFiltering = useShouldUseWorkspaceUniverseFiltering();

  const workspace = useMemo<WorkspaceIdentity | undefined>(() => {
    if (
      !shouldUseWorkspaceUniverseFiltering ||
      !currentWorkspace?.creatorId ||
      (currentWorkspace.creatorType !== 'Group' && currentWorkspace.creatorType !== 'User')
    ) {
      return undefined;
    }

    return {
      creatorId: currentWorkspace.creatorId,
      creatorType: currentWorkspace.creatorType,
    };
  }, [
    currentWorkspace?.creatorId,
    currentWorkspace?.creatorType,
    shouldUseWorkspaceUniverseFiltering,
  ]);

  const rememberedUniverseId = useMemo<number | undefined>(
    () => (workspace ? getRememberedWorkspaceUniverseId(workspace) : undefined),
    [workspace],
  );

  const rememberUniverseId = useCallback(
    (universeId: number): void => {
      if (!workspace) {
        return;
      }

      rememberWorkspaceUniverseId(workspace, universeId);
    },
    [workspace],
  );

  return { rememberedUniverseId, rememberUniverseId };
};

export default useWorkspaceUniverseMemory;
