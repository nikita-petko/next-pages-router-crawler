import { useMutation } from '@tanstack/react-query';
import { useTranslation } from '@rbx/intl';
import itemconfigurationClient from '@modules/clients/itemconfiguration';

interface UseDeleteFolderMutationOptions {
  onSuccess: () => void;
  onError: (message: string) => void;
}

/**
 * Deletes a folder via itemconfiguration. Delegates success / error messaging to the caller.
 */
const useDeleteFolderMutation = ({ onSuccess, onError }: UseDeleteFolderMutationOptions) => {
  const { translate } = useTranslation();

  const { mutate: deleteFolder, isPending: isDeletingFolder } = useMutation({
    mutationFn: (folderId: string) => itemconfigurationClient.deleteFolder(folderId),
    onSuccess,
    onError: () => {
      onError(translate('Message.DeleteFolderFailure'));
    },
  });

  return { deleteFolder, isDeletingFolder };
};

export default useDeleteFolderMutation;
