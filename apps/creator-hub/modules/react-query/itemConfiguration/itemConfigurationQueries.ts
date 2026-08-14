import { useMutation, useQuery } from '@tanstack/react-query';
import type { RobloxItemConfigurationApiModelsFolderFolderItemItemTypeEnum } from '@rbx/client-itemconfiguration/v1';
import type {
  ItemConfigurationClient,
  ItemConfigurationCollectiblesMetadataResponse,
} from '@modules/clients/itemconfiguration';

const defaultMetadataResponse: ItemConfigurationCollectiblesMetadataResponse = {};

export default function useGetMetadata(itemConfigurationClient: ItemConfigurationClient) {
  return useQuery({
    queryKey: ['metadata'],
    queryFn: async () => {
      try {
        const metadataResponse = await itemConfigurationClient.getCollectiblesMetadata();
        return metadataResponse ?? defaultMetadataResponse;
      } catch {
        return defaultMetadataResponse;
      }
    },
  });
}

/** Query key for a creator's (or group's) folder list. Exported so mutations can invalidate it. */
export const getFoldersQueryKey = (groupId?: number) => ['folders', groupId ?? null] as const;

/**
 * Fetches the folder list for the current creator (or group). Pass `enabled: false` to defer the
 * request until it is needed — e.g. only when a folder picker is opened.
 */
export function useGetFolders(
  itemConfigurationClient: ItemConfigurationClient,
  groupId?: number,
  enabled = true,
) {
  return useQuery({
    queryKey: getFoldersQueryKey(groupId),
    queryFn: () => itemConfigurationClient.getFolders(groupId),
    enabled,
  });
}

interface MutationCallbacks<TSuccess = void> {
  onSuccess: (result: TSuccess) => void;
  onError: (error: unknown) => void;
}

interface AddItemToFolderVariables {
  itemId: string;
  itemType: RobloxItemConfigurationApiModelsFolderFolderItemItemTypeEnum;
  folderId: string;
}

/** Adds a single item to a folder. Error-code → message mapping is left to the caller's onError. */
export function useAddItemToFolderMutation(
  itemConfigurationClient: ItemConfigurationClient,
  { onSuccess, onError }: MutationCallbacks,
) {
  return useMutation({
    mutationFn: (variables: AddItemToFolderVariables) =>
      itemConfigurationClient.addItemToFolder(
        variables.itemId,
        variables.itemType,
        variables.folderId,
      ),
    onSuccess,
    onError,
  });
}

interface CreateFolderVariables {
  name: string;
  groupId?: number;
}

/** Creates a folder and hands the new folder id to onSuccess. */
export function useCreateFolderMutation(
  itemConfigurationClient: ItemConfigurationClient,
  { onSuccess, onError }: MutationCallbacks<string>,
) {
  return useMutation({
    mutationFn: (variables: CreateFolderVariables) =>
      itemConfigurationClient.createFolder(variables.name, undefined, variables.groupId),
    onSuccess: (response) => onSuccess(response.folderId ?? ''),
    onError,
  });
}

interface UpdateFolderVariables {
  folderId: string;
  name: string;
}

/** Renames a folder. */
export function useUpdateFolderMutation(
  itemConfigurationClient: ItemConfigurationClient,
  { onSuccess, onError }: MutationCallbacks,
) {
  return useMutation({
    mutationFn: (variables: UpdateFolderVariables) =>
      itemConfigurationClient.updateFolder(variables.folderId, variables.name),
    onSuccess,
    onError,
  });
}
