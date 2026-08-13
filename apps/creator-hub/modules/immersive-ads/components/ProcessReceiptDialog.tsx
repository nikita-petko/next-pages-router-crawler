import { useCallback } from 'react';
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import ProcessReceiptCodeSnippet from './ProcessReceiptCodeSnippet';

interface ProcessReceiptDialogProps {
  productIds: number[];
  onClose: () => void;
}

const ProcessReceiptDialog = ({ productIds, onClose }: ProcessReceiptDialogProps) => {
  const { tPendingTranslation, translate } = useTranslationWrapper(useTranslation());
  const viewCodeSnippetLabel = tPendingTranslation(
    'View code snippet',
    'Menu action for viewing the server-side ProcessReceipt code snippet.',
    translationKey('Action.ViewCodeSnippet', TranslationNamespace.ImmersiveAdsAnalytics),
  );
  const closeLabel = translate(translationKey('Action.Close', TranslationNamespace.Controls));
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        onClose();
      }
    },
    [onClose],
  );

  return (
    <Dialog
      size='Large'
      isModal
      open
      onOpenChange={handleOpenChange}
      hasCloseAffordance
      closeLabel={closeLabel}>
      <DialogContent>
        <DialogBody>
          <div className='flex flex-col gap-medium padding-top-medium'>
            <DialogTitle>{viewCodeSnippetLabel}</DialogTitle>
            <ProcessReceiptCodeSnippet productIds={productIds} />
          </div>
        </DialogBody>
        <DialogFooter>
          <div className='flex width-full justify-end'>
            <Button variant='Standard' size='Medium' onClick={onClose}>
              {closeLabel}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default withTranslation(ProcessReceiptDialog, [
  TranslationNamespace.Controls,
  TranslationNamespace.ImmersiveAdsAnalytics,
]);
