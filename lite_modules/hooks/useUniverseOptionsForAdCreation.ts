import { SearchCreatorType } from '@rbx/client-universes-api/v1';
import { useWorkspaces } from '@rbx/creator-hub-navigation';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import useShouldUseWorkspaceUniverseFiltering from '@hooks/useShouldUseWorkspaceUniverseFiltering';
import { listUniverseOptionsForAdCreation } from '@services/ads/getUniversesService';
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

const EMPTY_UNIVERSE_OPTIONS: AdvertisedUniverse[] = [];

const useUniverseOptionsForAdCreation = ({
  enabled = true,
}: UseUniverseOptionsForAdCreationOptions = {}): UniverseOptionsForAdCreationResult => {
  const isWorkspaceScopingEnabled = useShouldUseWorkspaceUniverseFiltering();
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
    universeOptions: universeOptions ?? EMPTY_UNIVERSE_OPTIONS,
  };
};

export default useUniverseOptionsForAdCreation;
