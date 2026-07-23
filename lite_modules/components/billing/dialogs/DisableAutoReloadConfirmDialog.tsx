import { Button } from '@rbx/foundation-ui';
import { type ReactElement, useState } from 'react';

import { openDialog } from '@components/common/dialog/actions';
import BaseDialog from '@components/common/dialog/BaseDialog';
import type { BaseInjectedDialogProps } from '@components/common/dialog/types';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { CaptureException } from '@utils/error';

interface DisableAutoReloadConfirmDialogProps extends BaseInjectedDialogProps {
  onConfirm: () => Promise<void>;
}

const DisableAutoReloadConfirmDialog = ({
  onClose,
  onConfirm,
  setDismissible,
}: DisableAutoReloadConfirmDialogProps): ReactElement => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Billing);
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
      CaptureException(error);
    } finally {
      setIsPending(false);
      setDismissible(true);
    }
  };

  return (
    <BaseDialog
      dialogBody={
        <div className='flex flex-col gap-y-small'>
          <p className='text-body-medium margin-none'>
            {translate('Description.DisableAllAutoReloadWarningPart1')}
          </p>
          <p className='text-body-medium margin-none'>
            {translate('Description.DisableAllAutoReloadWarningPart2')}
          </p>
        </div>
      }
      dialogFooter={
        <>
          <Button
            isDisabled={isPending}
            isLoading={isPending}
            onClick={handleConfirm}
            size='Medium'
            variant='Alert'>
            {translate('Action.Disable')}
          </Button>
          <Button isDisabled={isPending} onClick={onClose} size='Medium' variant='Standard'>
            {translate('Action.KeepOn')}
          </Button>
        </>
      }
      dialogTitle={translate('Heading.DisableAutoReload')}
    />
  );
};

export const openDisableAutoReloadConfirmDialog = (onConfirm: () => Promise<void>): void => {
  openDialog({
    component: DisableAutoReloadConfirmDialog,
    props: { onConfirm },
  });
};
