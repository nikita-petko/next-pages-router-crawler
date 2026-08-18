import { GetLocalStorage, SetLocalStorage } from '@utils/localStorage';

export interface WorkspaceIdentity {
  creatorId: number;
  creatorType: 'Group' | 'User';
}

const LAST_SELECTED_UNIVERSE_ID_KEY_PREFIX = 'lastSelectedUniverseId';

export const getWorkspaceUniverseStorageKey = ({
  creatorId,
  creatorType,
}: WorkspaceIdentity): string =>
  `${LAST_SELECTED_UNIVERSE_ID_KEY_PREFIX}:${creatorType}:${creatorId}`;

export const getRememberedWorkspaceUniverseId = (
  workspace: WorkspaceIdentity,
): number | undefined => {
  const universeId = GetLocalStorage(getWorkspaceUniverseStorageKey(workspace));
  return typeof universeId === 'number' && Number.isInteger(universeId) && universeId > 0
    ? universeId
    : undefined;
};

export const rememberWorkspaceUniverseId = (
  workspace: WorkspaceIdentity,
  universeId: number,
): void => {
  if (!Number.isInteger(universeId) || universeId <= 0) {
    return;
  }

  SetLocalStorage(getWorkspaceUniverseStorageKey(workspace), universeId);
};
