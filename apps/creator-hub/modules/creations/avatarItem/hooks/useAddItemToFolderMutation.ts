import { useMutation } from '@tanstack/react-query';
import type { RobloxItemConfigurationApiModelsFolderFolderItemItemTypeEnum } from '@rbx/client-itemconfiguration/v1';
import { useTranslation } from '@rbx/intl';
import itemconfigurationClient from '@modules/clients/itemconfiguration';
import tryParseResponseError from '@modules/clients/utils/tryParseResponseError';

interface AddItemToFolderParams {
  itemId: string;
  itemType: RobloxItemConfigurationApiModelsFolderFolderItemItemTypeEnum;
  folderId: string;
}

interface UseAddItemToFolderMutationOptions {
  onSuccess: () => void;
  onError: (message: string) => void;
}

/**
 * Adds a single item to a folder via itemconfiguration. Maps the item-level error codes to localized
 * messages and delegates success / error messaging to the caller.
 */
const useAddItemToFolderMutation = ({ onSuccess, onError }: UseAddItemToFolderMutationOptions) => {
  const { translate } = useTranslation();

  const { mutate: addItemToFolder, isPending: isAddingItem } = useMutation({
    mutationFn: (params: AddItemToFolderParams) =>
      itemconfigurationClient.addItemToFolder(params.itemId, params.itemType, params.folderId),
    onSuccess,
    onError: async (error) => {
      const errorResponse = await tryParseResponseError(error);
      switch (errorResponse?.code ?? -1) {
        case 3:
          onError(translate('Error.ItemIdInvalid'));
          break;
        case 9:
          onError(translate('Error.ItemNotOwned'));
          break;
        case 6:
          onError(translate('Message.ItemNotFound'));
          break;
        default:
          onError(translate('Error.AddItemToFolderFailure'));
          break;
      }
    },
  });

  return { addItemToFolder, isAddingItem };
};

export default useAddItemToFolderMutation;
