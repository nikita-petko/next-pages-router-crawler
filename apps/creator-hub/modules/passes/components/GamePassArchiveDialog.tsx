import { useQueryClient } from '@tanstack/react-query';
import { TranslatedArchiveConfirmationDialogContent } from '@modules/monetization-shared/archive-dialog/ArchiveConfirmationDialog';
import { closeDialog, openDialog } from '@modules/monetization-shared/dialog/actions';
import { openRequestErrorDialog } from '@modules/monetization-shared/error-dialogs';
import { shopsKeys } from '@modules/shops/queries/constants';
import { useUpdateGamePass } from '../queries/useUpdateGamePass';

type Props = {
  universeId: number;
  gamePassId: number;
  isArchived: boolean;
  onSuccess?: () => void;
  onClose: () => void;
};

/**
 * Game-pass mutation wiring for the shared archive confirmation dialog.
 */
function GamePassArchiveDialogContent({
  universeId,
  gamePassId,
  isArchived,
  onSuccess,
  onClose,
}: Props) {
  const queryClient = useQueryClient();
  const { mutate: updatePass, isPending } = useUpdateGamePass(
    { universeId, gamePassId },
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
        updatePass(
          { isArchived: !isArchived },
          {
            onSuccess: () => {
              void queryClient.invalidateQueries({ queryKey: shopsKeys.items() });
              handleSuccess();
            },
          },
        );
      }}
    />
  );
}

type OpenParams = {
  universeId: number;
  gamePassId: number;
  isArchived: boolean;
  onSuccess?: () => void;
};

export function openGamePassArchiveDialog({
  universeId,
  gamePassId,
  isArchived,
  onSuccess,
}: OpenParams) {
  openDialog({
    content: (
      <GamePassArchiveDialogContent
        universeId={universeId}
        gamePassId={gamePassId}
        isArchived={isArchived}
        onSuccess={onSuccess}
        onClose={closeDialog}
      />
    ),
  });
}
