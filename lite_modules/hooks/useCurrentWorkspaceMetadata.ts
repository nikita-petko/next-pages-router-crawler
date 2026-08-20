import { useWorkspaces } from '@rbx/creator-hub-navigation';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

import { getAdsMetadata } from '@services/ads/getMetadataService';

const STALE_TIME_MS = 5 * 60 * 1000;
const GC_TIME_MS = 15 * 60 * 1000;

interface WorkspaceIdentity {
  creatorId: number;
  creatorType: 'Group' | 'User';
}

export const getWorkspaceIdentity = (
  currentWorkspace?: {
    creatorId?: number;
    creatorType?: string;
  } | null,
): WorkspaceIdentity | undefined => {
  if (
    currentWorkspace?.creatorId == null ||
    (currentWorkspace.creatorType !== 'Group' && currentWorkspace.creatorType !== 'User')
  ) {
    return undefined;
  }

  return {
    creatorId: currentWorkspace.creatorId,
    creatorType: currentWorkspace.creatorType,
  };
};

// Returns the backend-resolved ad-account auto-create value for the selected
// workspace. The frontend must not recompute the decision.
const useCurrentWorkspaceMetadata = (): boolean | undefined => {
  const { currentWorkspace, isLoading: isWorkspaceLoading, workspaces } = useWorkspaces();
  const previousWorkspaceType = useRef<WorkspaceIdentity['creatorType'] | undefined>(undefined);
  const [personalRequestVersion, setPersonalRequestVersion] = useState<number>(0);
  const workspace = getWorkspaceIdentity(currentWorkspace);
  const workspaceId = workspace?.creatorId;
  const workspaceType = workspace?.creatorType;
  // Creator Hub can report isLoading=false while replacing a provisional personal
  // workspace with a persisted group selection. Wait for the complete identity.
  const isWorkspaceResolved = !isWorkspaceLoading && workspaces != null && workspace !== undefined;
  const groupId = workspaceType === 'Group' ? workspaceId : undefined;
  const isGroupWorkspaceResolved = isWorkspaceResolved && groupId !== undefined;
  const shouldRefreshPersonalWorkspace =
    isWorkspaceResolved && workspaceType === 'User' && personalRequestVersion > 0;

  useEffect(() => {
    if (!isWorkspaceResolved || workspaceType === undefined) {
      return;
    }
    if (previousWorkspaceType.current === 'Group' && workspaceType === 'User') {
      setPersonalRequestVersion((version) => version + 1);
    }
    previousWorkspaceType.current = workspaceType;
  }, [isWorkspaceResolved, workspaceType]);

  const query = useQuery({
    enabled: isGroupWorkspaceResolved || shouldRefreshPersonalWorkspace,
    gcTime: GC_TIME_MS,
    queryFn: ({ signal }) => getAdsMetadata(groupId, signal),
    queryKey:
      workspaceType === 'User'
        ? ['metadata', 'User', workspaceId, personalRequestVersion]
        : ['metadata', workspaceType ?? null, workspaceId ?? null],
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: true,
    retry: false,
    staleTime: STALE_TIME_MS,
  });

  if (!isGroupWorkspaceResolved && !shouldRefreshPersonalWorkspace) {
    return undefined;
  }
  // TanStack Query retains the last successful data when a background refetch
  // fails. Continue using that workspace decision instead of reverting to the
  // user baseline.
  return query.data?.isAdAccountAutoCreateEnabled;
};

export default useCurrentWorkspaceMetadata;
