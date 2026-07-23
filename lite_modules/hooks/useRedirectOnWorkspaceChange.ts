import { useWorkspaces } from '@rbx/creator-hub-navigation';
import { useRouter } from 'next/router';
import { useEffect, useRef } from 'react';

import Routes from '@constants/routes';
import type { CreatorWorkspace } from '@type/groupScopedAccount';

const getWorkspaceKey = (workspace?: CreatorWorkspace | null): string | null => {
  if (!workspace?.creatorType || workspace.creatorId == null) {
    return null;
  }

  return `${workspace.creatorType}:${workspace.creatorId}`;
};

/**
 * Redirects to /manage when the Creator Hub workspace changes while the
 * current page is mounted. Skips the initial workspace resolution so landing
 * on the page does not bounce the user away.
 */
const useRedirectOnWorkspaceChange = (enabled: boolean = true): void => {
  const router = useRouter();
  const { currentWorkspace, isLoading: isWorkspaceLoading, workspaces } = useWorkspaces();
  const workspaceKey = getWorkspaceKey(currentWorkspace);
  const previousWorkspaceKeyRef = useRef<string | null>(null);
  // Match NavigationRail: isLoading can be false while currentWorkspace is still
  // provisional and workspaces is null. Wait until the list resolves before
  // recording a baseline, otherwise personal → persisted group looks like a switch.
  const isWorkspaceResolved = !isWorkspaceLoading && workspaces != null && workspaceKey !== null;

  useEffect(() => {
    if (!enabled || !isWorkspaceResolved) {
      return;
    }

    if (
      previousWorkspaceKeyRef.current !== null &&
      previousWorkspaceKeyRef.current !== workspaceKey
    ) {
      router.replace(Routes.MANAGE);
      return;
    }

    previousWorkspaceKeyRef.current = workspaceKey;
  }, [enabled, isWorkspaceResolved, router, workspaceKey]);
};

export default useRedirectOnWorkspaceChange;
