import { Button } from '@rbx/foundation-ui';
import { type ReactElement, useState } from 'react';

import { openDialog } from '@components/common/dialog/actions';
import BaseDialog from '@components/common/dialog/BaseDialog';
import type { BaseInjectedDialogProps } from '@components/common/dialog/types';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { CaptureException } from '@utils/error';

interface PublishCampaignConfirmDialogProps extends BaseInjectedDialogProps {
  contentKeys: string[];
  onConfirm: () => void | Promise<void>;
}

const PublishCampaignConfirmDialog = ({
  contentKeys,
  onClose,
  onConfirm,
  setDismissible,
}: PublishCampaignConfirmDialogProps): ReactElement => {
  const { translate: translateCampaign } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const { translate: translateMisc } = useNamespacedTranslation(TranslationNamespace.Misc);
  const [isPending, setIsPending] = useState<boolean>(false);

  // Caller-owns-errors: onConfirm is expected to handle its own error UI
  // (e.g. opening EntitySubmitErrorDialog via last-in-wins). The catch here
  // is a logging backstop only — it keeps the dialog open so the replacement
  // error dialog can take over the slot.
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
          {contentKeys.map((key) => (
            <p className='text-body-medium margin-none' key={key}>
              {translateCampaign(key)}
            </p>
          ))}
        </div>
      }
      dialogFooter={
        <>
          <Button
            isDisabled={isPending}
            isLoading={isPending}
            onClick={handleConfirm}
            size='Medium'
            variant='Emphasis'>
            {translateCampaign('Action.PublishCampaign')}
          </Button>
          <Button isDisabled={isPending} onClick={onClose} size='Medium' variant='Standard'>
            {translateMisc('Action.Cancel')}
          </Button>
        </>
      }
      dialogTitle={translateCampaign('Heading.ConfirmSubmission')}
    />
  );
};

export const openPublishCampaignConfirmDialog = (
  contentKeys: string[],
  onConfirm: () => void | Promise<void>,
): void => {
  openDialog({
    component: PublishCampaignConfirmDialog,
    props: { contentKeys, onConfirm },
  });
};
