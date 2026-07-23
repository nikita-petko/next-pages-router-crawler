import { TranslatedArchiveConfirmationDialogContent } from '@modules/monetization-shared/archive-dialog/ArchiveConfirmationDialog';
import { closeDialog, openDialog } from '@modules/monetization-shared/dialog/actions';
import { openRequestErrorDialog } from '@modules/monetization-shared/error-dialogs';
import { useUpdateDeveloperProduct } from '../queries/useUpdateDeveloperProduct';

type Props = {
  universeId: number;
  itemId: number;
  isArchived: boolean;
  onSuccess?: () => void;
  onClose: () => void;
};

/**
 * Developer-product mutation wiring for the shared archive confirmation dialog.
 */
function DeveloperProductArchiveDialogContent({
  universeId,
  itemId,
  isArchived,
  onSuccess,
  onClose,
}: Props) {
  const { mutate: updateProduct, isPending } = useUpdateDeveloperProduct(
    { universeId, productId: itemId },
    {
      onError: () => {
        openRequestErrorDialog();
      },
    },
  );

  return (
    <TranslatedArchiveConfirmationDialogContent
      isArchived={isArchived}
      isPending={isPending}
      onSuccess={onSuccess}
      onClose={onClose}
      onConfirm={({ onSuccess: handleSuccess }) => {
        updateProduct({ isArchived: !isArchived }, { onSuccess: handleSuccess });
      }}
    />
  );
}

type OpenParams = {
  universeId: number;
  itemId: number;
  isArchived: boolean;
  onSuccess?: () => void;
};

export function openDeveloperProductArchiveDialog({
  universeId,
  itemId,
  isArchived,
  onSuccess,
}: OpenParams) {
  openDialog({
    content: (
      <DeveloperProductArchiveDialogContent
        universeId={universeId}
        itemId={itemId}
        isArchived={isArchived}
        onSuccess={onSuccess}
        onClose={closeDialog}
      />
    ),
  });
}
