import { Button } from '@rbx/foundation-ui';
import { type ReactElement, useState } from 'react';

import { openDialog } from '@components/common/dialog/actions';
import BaseDialog from '@components/common/dialog/BaseDialog';
import type { BaseInjectedDialogProps } from '@components/common/dialog/types';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { CaptureException } from '@utils/error';

interface ArchiveAdIntegrationCampaignDialogProps extends BaseInjectedDialogProps {
  /**
   * Invoked when the user confirms archival. May return a Promise; the
   * dialog awaits it to drive the confirm button's loading state and
   * disable both actions while the API call is in flight.
   */
  onConfirm: () => void | Promise<void>;
}

const ArchiveAdIntegrationCampaignDialog = ({
  onClose,
  onConfirm,
  setDismissible,
}: ArchiveAdIntegrationCampaignDialogProps): ReactElement => {
  const { translate: translateMisc } = useNamespacedTranslation(TranslationNamespace.Misc);
  const { translate: translateCampaign } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const [isPending, setIsPending] = useState<boolean>(false);

  const handleConfirm = async (): Promise<void> => {
    if (isPending) {
      return;
    }
    setIsPending(true);
    setDismissible(false);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      // Backstop logging — see CancelCampaignDialog for the rationale.
      CaptureException(error);
    } finally {
      setIsPending(false);
      setDismissible(true);
    }
  };

  return (
    <BaseDialog
      dialogDescription={translateMisc('Description.ArchiveAdIntegrationCampaignConfirmation')}
      dialogFooter={
        <>
          <Button
            isDisabled={isPending}
            isLoading={isPending}
            onClick={handleConfirm}
            size='Medium'
            variant='Alert'>
            {translateMisc('Action.ArchiveCampaign')}
          </Button>
          <Button isDisabled={isPending} onClick={onClose} size='Medium' variant='Standard'>
            {translateCampaign('Action.GoBack')}
          </Button>
        </>
      }
      dialogTitle={translateMisc('Heading.ArchiveAdIntegrationCampaign')}
    />
  );
};

/**
 * Imperative opener for the archive-ad-integration-campaign confirm dialog.
 * Callers supply `onConfirm`; the outlet injects `onClose` + `setDismissible`.
 *
 * No identity-checked closer is exported because every caller's dismiss path
 * goes through the dialog's own buttons (which use the injected onClose).
 * Add one with `makeOwnedCloser` if a deferred callback ever needs to dismiss
 * this specific dialog without risking a cross-dialog race.
 */
export const openArchiveAdIntegrationCampaignDialog = (
  onConfirm: () => void | Promise<void>,
): void => {
  openDialog({ component: ArchiveAdIntegrationCampaignDialog, props: { onConfirm } });
};

export default ArchiveAdIntegrationCampaignDialog;
