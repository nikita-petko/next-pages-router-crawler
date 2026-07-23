import { SearchCreatorType } from '@rbx/client-universes-api/v1';
import { useWorkspaces } from '@rbx/creator-hub-navigation';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { listUniverseOptionsForAdCreation } from '@services/ads/getUniversesService';
import { AppStoreType, useAppStore } from '@stores/appStoreProvider';
import { type AdvertisedUniverse } from '@type/universe';

interface UniverseOptionsForAdCreationResult {
  groupId?: number;
  isError: boolean;
  isLoading: boolean;
  shouldWaitForWorkspace: boolean;
  universeOptions: AdvertisedUniverse[];
}

interface UseUniverseOptionsForAdCreationOptions {
  enabled?: boolean;
}

const useUniverseOptionsForAdCreation = ({
  enabled = true,
}: UseUniverseOptionsForAdCreationOptions = {}): UniverseOptionsForAdCreationResult => {
  const isInternalAdAccount = useAppStore((state: AppStoreType) =>
    state.adAccountIsInternalManaged(),
  );
  const isAdAccountAutoCreateEnabled = useAppStore(
    (state: AppStoreType) => state.appMetadataState?.data?.isAdAccountAutoCreateEnabled ?? false,
  );
  const isWorkspaceScopingEnabled = isAdAccountAutoCreateEnabled && !isInternalAdAccount;
  const { currentWorkspace, isLoading: isWorkspaceLoading } = useWorkspaces();
  const shouldWaitForWorkspace = isWorkspaceScopingEnabled && isWorkspaceLoading;

  const creatorContext = useMemo(() => {
    if (!isWorkspaceScopingEnabled || shouldWaitForWorkspace) {
      return undefined;
    }

    if (currentWorkspace?.creatorType === 'Group' && currentWorkspace.creatorId) {
      return {
        creatorTargetId: currentWorkspace.creatorId,
        creatorType: SearchCreatorType.Group,
      };
    }

    if (currentWorkspace?.creatorType === 'User' && currentWorkspace.creatorId) {
      return {
        creatorTargetId: currentWorkspace.creatorId,
        creatorType: SearchCreatorType.User,
      };
    }

    return undefined;
  }, [
    currentWorkspace?.creatorId,
    currentWorkspace?.creatorType,
    isWorkspaceScopingEnabled,
    shouldWaitForWorkspace,
  ]);

  const {
    data: universeOptions,
    isError,
    isLoading,
  } = useQuery({
    enabled: enabled && !shouldWaitForWorkspace,
    queryFn: () => listUniverseOptionsForAdCreation(creatorContext),
    queryKey: ['adCreationUniverseOptions', creatorContext],
  });

  const groupId =
    creatorContext?.creatorType === SearchCreatorType.Group
      ? creatorContext.creatorTargetId
      : undefined;

  return {
    groupId,
    isError,
    isLoading,
    shouldWaitForWorkspace,
    universeOptions: universeOptions ?? [],
  };
};

export default useUniverseOptionsForAdCreation;
