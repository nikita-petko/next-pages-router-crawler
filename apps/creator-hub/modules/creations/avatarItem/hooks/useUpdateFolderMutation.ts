import { useMutation } from '@tanstack/react-query';
import { useTranslation } from '@rbx/intl';
import itemconfigurationClient from '@modules/clients/itemconfiguration';
import tryParseResponseError from '@modules/clients/utils/tryParseResponseError';

interface UpdateFolderParams {
  folderId: string;
  folderName: string;
}

interface UseUpdateFolderMutationOptions {
  onSuccess: () => void;
  onError: (message: string) => void;
}

/**
 * Renames a folder via itemconfiguration. Maps the moderation error code to a localized message and
 * delegates success / error messaging to the caller.
 */
const useUpdateFolderMutation = ({ onSuccess, onError }: UseUpdateFolderMutationOptions) => {
  const { translate } = useTranslation();

  const { mutate: updateFolder, isPending: isUpdatingFolder } = useMutation({
    mutationFn: (params: UpdateFolderParams) =>
      itemconfigurationClient.updateFolder(params.folderId, params.folderName),
    onSuccess,
    onError: async (error) => {
      const errorResponse = await tryParseResponseError(error);
      switch (errorResponse?.code ?? -1) {
        case 14:
          onError(translate('Error.FolderNameModerated'));
          break;
        default:
          onError(translate('Error.UpdateFolderFailure'));
          break;
      }
    },
  });

  return { updateFolder, isUpdatingFolder };
};

export default useUpdateFolderMutation;
