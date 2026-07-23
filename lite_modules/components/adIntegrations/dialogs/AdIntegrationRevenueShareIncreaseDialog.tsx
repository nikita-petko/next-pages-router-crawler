import { Button } from '@rbx/foundation-ui';
import { type ReactElement, useState } from 'react';

import { openDialog } from '@components/common/dialog/actions';
import BaseDialog from '@components/common/dialog/BaseDialog';
import type { BaseInjectedDialogProps } from '@components/common/dialog/types';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { CaptureException } from '@utils/error';

interface AdIntegrationRevenueShareIncreaseDialogProps extends BaseInjectedDialogProps {
  /**
   * Invoked when the user confirms the save. May return a Promise; the dialog
   * awaits it to drive the confirm button's loading state and disable both
   * actions while the underlying save is in flight.
   */
  onConfirm: () => void | Promise<void>;
}

const AdIntegrationRevenueShareIncreaseDialog = ({
  onClose,
  onConfirm,
  setDismissible,
}: AdIntegrationRevenueShareIncreaseDialogProps): ReactElement => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Misc);
  // `Action.OK` is a generic button string that lives in the CreativeLibrary
  // namespace (the same convention used for tooltip close labels in
  // `tooltips.ts`), so resolve it separately from the dialog's Misc copy.
  const { translate: translateCreativeLibrary } = useNamespacedTranslation(
    TranslationNamespace.CreativeLibrary,
  );
  const [isPending, setIsPending] = useState<boolean>(false);

  // Caller-owns-errors: onConfirm handles its own error UI (it surfaces an
  // error dialog via last-in-wins). The catch here is a logging backstop only,
  // keeping this dialog open so the replacement error dialog can take the slot.
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
      CaptureException(error);
    } finally {
      setIsPending(false);
      setDismissible(true);
    }
  };

  return (
    <BaseDialog
      dialogDescription={translate('Description.RevenueShareIncreaseConfirmation')}
      dialogFooter={
        <>
          <Button
            isDisabled={isPending}
            isLoading={isPending}
            onClick={handleConfirm}
            size='Medium'
            variant='Emphasis'>
            {translateCreativeLibrary('Action.OK')}
          </Button>
          <Button isDisabled={isPending} onClick={onClose} size='Medium' variant='Standard'>
            {translate('Action.Cancel')}
          </Button>
        </>
      }
      dialogTitle={translate('Heading.RevenueShareIncrease')}
    />
  );
};

/**
 * Imperative opener for the revenue-share-increase confirm dialog. Shown when a
 * live ad integration campaign's duration is extended, since a longer run-time
 * increases the maximum revenue share owed. Callers supply `onConfirm`; the
 * outlet injects `onClose` + `setDismissible`.
 */
export const openAdIntegrationRevenueShareIncreaseDialog = (
  onConfirm: () => void | Promise<void>,
): void => {
  openDialog({
    component: AdIntegrationRevenueShareIncreaseDialog,
    options: { size: 'Medium' },
    props: { onConfirm },
  });
};

export default AdIntegrationRevenueShareIncreaseDialog;
