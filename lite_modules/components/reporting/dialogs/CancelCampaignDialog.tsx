import { Button } from '@rbx/foundation-ui';
import { type ReactElement, useState } from 'react';

import { makeOwnedCloser, openDialog } from '@components/common/dialog/actions';
import BaseDialog from '@components/common/dialog/BaseDialog';
import type { BaseInjectedDialogProps } from '@components/common/dialog/types';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { CaptureException } from '@utils/error';

interface CancelCampaignDialogProps extends BaseInjectedDialogProps {
  /**
   * Invoked when the user confirms cancellation. May return a Promise; the
   * dialog awaits it to drive the confirm button's loading state and disable
   * both actions while the API call is in flight.
   */
  onConfirm: () => void | Promise<void>;
}

const CancelCampaignDialog = ({
  onClose,
  onConfirm,
  setDismissible,
}: CancelCampaignDialogProps): ReactElement => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const [isPending, setIsPending] = useState<boolean>(false);

  const handleConfirm = async (): Promise<void> => {
    if (isPending) {
      return;
    }
    setIsPending(true);
    setDismissible(false);
    try {
      await onConfirm();
      // Auto-close on success so callers don't have to remember
      // `.finally(closeDialog)` — forgetting it stacks the legacy error
      // modal on top of this one (two focus-trapped layers). On rejection
      // we deliberately stay open so the caller can decide whether to
      // dismiss (e.g. when surfacing a separate error modal) or keep the
      // dialog visible for an inline retry.
      onClose();
    } catch (error) {
      // Callers are expected to handle their own errors inside `onConfirm`.
      // We log here as a backstop so a forgotten `.catch` at the call site
      // doesn't make the failure disappear silently, while keeping the
      // React click handler from leaking the rejection globally.
      CaptureException(error);
    } finally {
      setIsPending(false);
      setDismissible(true);
    }
  };

  return (
    <BaseDialog
      dialogDescription={translate('Description.CancelCampaignConfirmation')}
      dialogFooter={
        <>
          <Button
            isDisabled={isPending}
            isLoading={isPending}
            onClick={handleConfirm}
            size='Medium'
            variant='Alert'>
            {translate('Action.CancelCampaign')}
          </Button>
          <Button isDisabled={isPending} onClick={onClose} size='Medium' variant='Standard'>
            {translate('Action.GoBack')}
          </Button>
        </>
      }
      dialogTitle={translate('Heading.CancelCampaign')}
    />
  );
};

/**
 * Imperative trigger — callable from any handler. Uses component mode so the
 * dialog's `useTranslation()` re-evaluates on every render (no stale locale).
 * `onClose` and `setDismissible` are injected by the dialog outlet; callers
 * only supply `onConfirm`. Return a Promise from `onConfirm` to drive the
 * dialog's loading/disabled state for the duration of the API call.
 */
export const openCancelCampaignDialog = (onConfirm: () => void | Promise<void>): void => {
  openDialog({ component: CancelCampaignDialog, props: { onConfirm } });
};

/**
 * Identity-checked closer for the cancel-campaign dialog. Prefer this over
 * the generic `closeDialog` when dismissing your own dialog — it no-ops if
 * the store has been taken over by a different dialog in the meantime,
 * which prevents deferred callbacks from closing the wrong slot.
 */
export const closeCancelCampaignDialog = makeOwnedCloser(CancelCampaignDialog);

export default CancelCampaignDialog;
